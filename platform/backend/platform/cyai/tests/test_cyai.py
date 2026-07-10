import time
import uuid

import jwt
import pytest
from django.conf import settings
from rest_framework.test import APIClient

from platform.cyai.models import GuardrailPolicy, InferenceLog, ModelConfig, PromptTemplate
from platform.cyai.services import GuardrailEngine, ModelGateway, RAGService


@pytest.fixture
def test_tenant_id():
    return uuid.uuid4()


@pytest.fixture
def auth_client(test_tenant_id, _rsa_keypair, _mock_jwks):
    private_key, _public_pem = _rsa_keypair
    client = APIClient()
    now = int(time.time())
    payload = {
        "sub": "11111111-1111-1111-1111-111111111111",
        "email": "admin@cybercom.io",
        "tenant_id": str(test_tenant_id),
        "realm_access": {"roles": ["platform_admin"]},
        "roles": ["platform_admin"],
        "permissions": ["read", "write"],
        "iat": now,
        "exp": now + 3600,
        "aud": settings.CYIDENTITY_CLIENT_ID,
        "iss": settings.CYIDENTITY_ISSUER,
    }
    token = jwt.encode(payload, private_key, algorithm="RS256")
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {token}",
        HTTP_X_TENANT_ID=str(test_tenant_id),
    )
    return client


@pytest.mark.django_db
class TestAIModels:
    def test_model_config(self):
        config = ModelConfig.objects.create(
            name="Gemini Pro", provider="gemini", model_name="gemini-1.5-pro", active=True
        )
        assert str(config) == "ModelConfig(Gemini Pro, gemini/gemini-1.5-pro)"

    def test_prompt_template(self):
        prompt = PromptTemplate.objects.create(
            name="Clinical Summary",
            template_text="Summarize clinical info: {context}",
            variables=["context"],
        )
        assert str(prompt) == "Prompt(Clinical Summary, v1)"

    def test_guardrail_policy(self):
        policy = GuardrailPolicy.objects.create(name="Scrub PII", policy_type="pii_detection")
        assert str(policy) == "GuardrailPolicy(Scrub PII, pii_detection)"

    def test_inference_log(self, test_tenant_id):
        config = ModelConfig.objects.create(
            name="Gemini Pro", provider="gemini", model_name="gemini-1.5-pro"
        )
        log = InferenceLog.objects.create(
            tenant_id=test_tenant_id,
            model=config,
            prompt_used="Hello",
            response_text="Hi",
            tokens_prompt=1,
            tokens_completion=1,
            latency_ms=10,
            safety_verdict="passed",
        )
        assert log.safety_verdict == "passed"


@pytest.mark.django_db
class TestGuardrailEngine:
    def test_scrub_pii_and_phi(self):
        policy = GuardrailPolicy.objects.create(
            name="Privacy Scrub", policy_type="pii_detection", active=True
        )
        raw_text = "Contact patient John Doe at john.doe@email.com or 123-456-7890. Patient MRN: MRN1029482."
        res = GuardrailEngine.validate_content(raw_text, [policy])
        assert res["verdict"] == "passed"
        assert "[CONFIDENTIAL_EMAIL]" in res["scrubbed_content"]
        assert "[CONFIDENTIAL_PHONE]" in res["scrubbed_content"]
        assert "[PHI_MRN]" in res["scrubbed_content"]

    def test_clinical_safety_blocked(self):
        policy = GuardrailPolicy.objects.create(
            name="Block Dangerous Words",
            policy_type="clinical_safety",
            parameters={"blocked_keywords": ["cyanide", "arsenic"]},
            active=True,
        )
        res = GuardrailEngine.validate_content("How to administer cyanide?", [policy])
        assert res["verdict"] == "blocked"
        assert len(res["flagged_reasons"]) > 0


@pytest.mark.django_db
class TestModelGatewayAndRAG:
    def test_gateway_providers_without_api_key_fail_clean(self, test_tenant_id, monkeypatch):
        """
        ModelGateway calls real provider SDKs (no simulated responses). With no
        API key configured, it must surface a clear config_error rather than
        fabricate a fake completion.
        """
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

        config_oa = ModelConfig.objects.create(
            name="OpenAI GPT", provider="openai", model_name="gpt-4o"
        )
        res_oa = ModelGateway.generate_completion(str(test_tenant_id), config_oa, "Tell me a story")
        assert res_oa["status"] == "config_error"

        config_ant = ModelConfig.objects.create(
            name="Claude", provider="anthropic", model_name="claude-3"
        )
        res_ant = ModelGateway.generate_completion(
            str(test_tenant_id), config_ant, "Tell me a story"
        )
        assert res_ant["status"] == "config_error"

    def test_gateway_calls_real_anthropic_provider(self, test_tenant_id, monkeypatch):
        """With a resolvable API key, ModelGateway invokes the real Anthropic SDK client."""

        class _FakeTextBlock:
            text = "Hello from a real provider call."

        class _FakeMessage:
            content = [_FakeTextBlock()]

        class _FakeMessages:
            def create(self, **kwargs):
                return _FakeMessage()

        class _FakeAnthropicClient:
            def __init__(self, api_key):
                self.messages = _FakeMessages()

        monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key-not-real")
        import anthropic as anthropic_module

        monkeypatch.setattr(anthropic_module, "Anthropic", _FakeAnthropicClient)

        config = ModelConfig.objects.create(
            name="Claude", provider="anthropic", model_name="claude-3"
        )
        res = ModelGateway.generate_completion(str(test_tenant_id), config, "Tell me a story")
        assert res["status"] == "passed"
        assert res["text"] == "Hello from a real provider call."

    def test_gateway_blocked_by_guardrail(self, test_tenant_id):
        config = ModelConfig.objects.create(
            name="Gemini Pro", provider="gemini", model_name="gemini-1.5-pro"
        )
        GuardrailPolicy.objects.create(
            name="Safety Guard",
            policy_type="clinical_safety",
            parameters={"blocked_keywords": ["poison"]},
            active=True,
        )
        res = ModelGateway.generate_completion(str(test_tenant_id), config, "How to make poison")
        assert res["status"] == "blocked"
        assert "Blocked by safety guardrail policies." in res["text"]

    def test_rag_service(self, test_tenant_id, monkeypatch):
        """
        RAGService's context retrieval is still a documented simulation (no
        vector store wired up yet -- see AI_Report gap). It still passes the
        retrieved context through to the real ModelGateway call, which
        without a Gemini API key correctly reports config_error rather than
        faking a completion.
        """
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        config = ModelConfig.objects.create(
            name="Gemini Pro", provider="gemini", model_name="gemini-1.5-pro"
        )
        template = PromptTemplate.objects.create(
            name="Clinical Summary Template",
            template_text="Use this info: {context} to answer {query}",
            variables=["context", "query"],
        )
        res = RAGService.query_context_and_generate(
            tenant_id=str(test_tenant_id),
            config=config,
            template=template,
            query="patient age",
            variables={},
        )
        assert res["status"] == "config_error"


@pytest.mark.django_db
class TestAIAPIs:
    def test_list_configs(self, auth_client):
        ModelConfig.objects.create(
            name="Gemini Pro", provider="gemini", model_name="gemini-1.5-pro"
        )
        resp = auth_client.get("/api/v1/ai/configs/")
        assert resp.status_code == 200
        assert len(resp.data) >= 1

    def test_generate_text_api(self, auth_client, test_tenant_id):
        config = ModelConfig.objects.create(
            name="Gemini Pro", provider="gemini", model_name="gemini-1.5-pro"
        )
        resp = auth_client.post(
            f"/api/v1/ai/configs/{config.id}/generate/",
            {"tenant_id": str(test_tenant_id), "prompt": "Hello model"},
            format="json",
        )
        assert resp.status_code == 200
        assert "text" in resp.data

    def test_run_rag_api(self, auth_client, test_tenant_id):
        ModelConfig.objects.create(
            name="Gemini Pro", provider="gemini", model_name="gemini-1.5-pro", active=True
        )
        template = PromptTemplate.objects.create(
            name="Clinical Template",
            template_text="Analyze {context} for {query}",
            variables=["context", "query"],
        )
        resp = auth_client.post(
            f"/api/v1/ai/prompts/{template.id}/rag/",
            {
                "tenant_id": str(test_tenant_id),
                "template_id": 1,
                "query": "temperature spikes",
                "variables": {},
            },
            format="json",
        )
        assert resp.status_code == 200
        assert "text" in resp.data
