import os
import re
import time
from typing import Any

from platform.cyai.models import GuardrailPolicy, InferenceLog, ModelConfig, PromptTemplate


class ModelConfigError(Exception):
    """Raised when a ModelConfig cannot be resolved to a usable, authenticated provider client."""


def _resolve_api_key(config: ModelConfig) -> str:
    """
    Resolves the provider API key for a ModelConfig.

    `api_key_ref` is a Vault path reference in production (ADR-0005 secrets
    management uses HashiCorp Vault) -- there is no Vault client wired into
    this service yet, so as an interim, documented step this treats
    `api_key_ref` as an environment variable name first, then falls back to
    the provider's conventional env var. Raises ModelConfigError rather than
    silently returning an empty/fake key.
    """
    provider_env_defaults = {
        "anthropic": "ANTHROPIC_API_KEY",
        "openai": "OPENAI_API_KEY",
        "gemini": "GEMINI_API_KEY",
    }
    if config.api_key_ref:
        key = os.environ.get(config.api_key_ref)
        if key:
            return key
    fallback_var = provider_env_defaults.get(config.provider.lower())
    if fallback_var:
        key = os.environ.get(fallback_var)
        if key:
            return key
    raise ModelConfigError(
        f"No API key resolvable for ModelConfig '{config.name}' (provider={config.provider}). "
        f"Set {config.api_key_ref or fallback_var or 'the provider API key env var'}."
    )


class GuardrailEngine:
    """
    Enforces privacy and clinical safety policies by scrubbing PII, PHI, and checking content bounds.
    """

    # Regex patterns for basic PII/PHI scrubbing
    EMAIL_PATTERN = re.compile(r"[\w\.-]+@[\w\.-]+\.\w+")
    PHONE_PATTERN = re.compile(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b")
    MRN_PATTERN = re.compile(r"\bMRN\d{6,10}\b", re.IGNORECASE)  # Medical Record Number (PHI)

    @classmethod
    def validate_content(cls, content: str, policies: list[GuardrailPolicy]) -> dict[str, Any]:
        verdict = "passed"
        flagged_reasons = []
        scrubbed_content = content

        for policy in policies:
            if not policy.active:
                continue

            policy_type = policy.policy_type.lower()
            if policy_type in ("pii_detection", "phi_scrub"):
                # Scrub Emails
                if cls.EMAIL_PATTERN.search(scrubbed_content):
                    scrubbed_content = cls.EMAIL_PATTERN.sub(
                        "[CONFIDENTIAL_EMAIL]", scrubbed_content
                    )
                    flagged_reasons.append(f"{policy.name}: PII Email detected and scrubbed")

                # Scrub Phones
                if cls.PHONE_PATTERN.search(scrubbed_content):
                    scrubbed_content = cls.PHONE_PATTERN.sub(
                        "[CONFIDENTIAL_PHONE]", scrubbed_content
                    )
                    flagged_reasons.append(f"{policy.name}: PII Phone number detected and scrubbed")

                # Scrub Medical Record Numbers (PHI)
                if cls.MRN_PATTERN.search(scrubbed_content):
                    scrubbed_content = cls.MRN_PATTERN.sub("[PHI_MRN]", scrubbed_content)
                    flagged_reasons.append(f"{policy.name}: PHI MRN detected and scrubbed")

            elif policy_type == "clinical_safety":
                blocked_keywords = policy.parameters.get("blocked_keywords", [])
                for kw in blocked_keywords:
                    if kw.lower() in scrubbed_content.lower():
                        verdict = "blocked"
                        flagged_reasons.append(
                            f"Clinical Safety Block: prohibited term '{kw}' found"
                        )

        return {
            "verdict": verdict,
            "flagged_reasons": flagged_reasons,
            "scrubbed_content": scrubbed_content,
        }


class ModelGateway:
    """
    Unified router to invoke LLM completion providers.
    """

    @classmethod
    def _call_provider(cls, config: ModelConfig, prompt: str) -> str:
        """Dispatches to the real provider SDK/API for this ModelConfig. Raises on failure."""
        provider = config.provider.lower()
        temperature = float(config.temperature)

        if provider == "anthropic":
            import anthropic

            client = anthropic.Anthropic(api_key=_resolve_api_key(config))
            response = client.messages.create(
                model=config.model_name,
                max_tokens=4096,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}],
            )
            return "".join(block.text for block in response.content if hasattr(block, "text"))

        if provider == "openai":
            import openai

            client = openai.OpenAI(api_key=_resolve_api_key(config))
            response = client.chat.completions.create(
                model=config.model_name,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content or ""

        if provider == "gemini":
            from google import genai

            client = genai.Client(api_key=_resolve_api_key(config))
            response = client.models.generate_content(model=config.model_name, contents=prompt)
            return response.text or ""

        if provider == "ollama":
            import requests

            base_url = config.api_base_url or "http://localhost:11434"
            resp = requests.post(
                f"{base_url.rstrip('/')}/api/generate",
                json={
                    "model": config.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": temperature},
                },
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json().get("response", "")

        raise ModelConfigError(f"Unsupported provider '{config.provider}' on ModelConfig '{config.name}'.")

    @classmethod
    def generate_completion(
        cls,
        tenant_id: str,
        config: ModelConfig,
        prompt: str,
        variables: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        start_time = time.monotonic()

        # Formulate final prompt
        final_prompt = prompt
        if variables:
            for k, v in variables.items():
                final_prompt = final_prompt.replace(f"{{{k}}}", str(v))

        # 1. Pre-inference guardrails validation
        policies = list(GuardrailPolicy.objects.filter(active=True))
        guardrail_res = GuardrailEngine.validate_content(final_prompt, policies)

        if guardrail_res["verdict"] == "blocked":
            log = InferenceLog.objects.create(
                tenant_id=tenant_id,
                model=config,
                prompt_used=final_prompt,
                response_text="Blocked by safety guardrail policies.",
                safety_verdict="blocked",
                error_message="Prompt blocked by Clinical Safety guardrail policy",
                latency_ms=0,
            )
            return {"text": log.response_text, "status": "blocked", "log_id": log.id}

        scrubbed_prompt = guardrail_res["scrubbed_content"]
        response_text = ""
        error_msg = ""
        verdict = "passed"

        try:
            response_text = cls._call_provider(config, scrubbed_prompt)
        except ModelConfigError as exc:
            error_msg = str(exc)
            verdict = "config_error"
        except Exception as exc:
            error_msg = str(exc)
            verdict = "flagged"

        elapsed_ms = int((time.monotonic() - start_time) * 1000)

        # 2. Post-inference output guardrails
        output_guardrail_res = GuardrailEngine.validate_content(response_text, policies)
        final_response = output_guardrail_res["scrubbed_content"]
        if output_guardrail_res["verdict"] == "blocked":
            final_response = "Blocked by safety guardrail policies."
            verdict = "blocked"

        log = InferenceLog.objects.create(
            tenant_id=tenant_id,
            model=config,
            prompt_used=final_prompt,
            response_text=final_response,
            tokens_prompt=len(scrubbed_prompt) // 4,
            tokens_completion=len(final_response) // 4,
            latency_ms=elapsed_ms,
            safety_verdict=verdict,
            error_message=error_msg,
        )

        return {
            "text": final_response,
            "status": verdict,
            "tokens_prompt": log.tokens_prompt,
            "tokens_completion": log.tokens_completion,
            "latency_ms": elapsed_ms,
            "log_id": log.id,
        }


class RAGService:
    """
    Simulates Retrieval-Augmented Generation (context search & template rendering).
    """

    @classmethod
    def query_context_and_generate(
        cls,
        tenant_id: str,
        config: ModelConfig,
        template: PromptTemplate,
        query: str,
        variables: dict[str, Any],
    ) -> dict[str, Any]:
        # Mimic retrieving semantic context from Vector Database (Milvus/pgvector)
        simulated_context = f"[Context: Search result for query '{query}': User medical records and consent policies match.]"

        merged_variables = {**variables, "context": simulated_context, "query": query}

        return ModelGateway.generate_completion(
            tenant_id=tenant_id,
            config=config,
            prompt=template.template_text,
            variables=merged_variables,
        )
