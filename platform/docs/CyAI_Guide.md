# CyAI Foundation Guide (Program 2.8)

This guide documents the LLM gateway, prompt engineering, safety guardrails, and RAG architectures of the **CyAI Platform**.

---

## 1. Unified Model Gateway

The `ModelGateway` routes completion requests to configure LLM providers (Gemini, OpenAI, Anthropic, and local Ollama instances) and handles automatic credential loading and routing fallbacks:
```python
from platform.cyai.services import ModelGateway
response = ModelGateway.generate_completion(
    tenant_id=tenant_id,
    config=model_config_object,
    prompt="Translate the following text to Arabic: {text}",
    variables={"text": "Hello world"}
)
```

---

## 2. Prompt Template Workbench

Prompts are stored as versioned templates in `PromptTemplate`. This allows developers to update text formats and template variables without changing source code:
*   **Version Control:** The template version is tracked (`version` counter). Only active, approved prompt templates are executed.

---

## 3. Security Guardrail Engine

The `GuardrailEngine` intercepts requests and responses to enforce safety policies:
*   **PII & PHI Scrubbing:** Automatically redacts Email addresses, Phone numbers, and Medical Record Numbers (MRN) before forwarding to public LLM endpoints.
*   **Clinical Safety Limits:** Prohibits blocked medical terms or unsafe drug suggestions.
*   **Evaluation Verdicts:** Logs inferences and marks status as `passed`, `flagged`, or `blocked` based on policy evaluations.

---

## 4. Retrieval-Augmented Generation (RAG)

The `RAGService` orchestrates prompt context augmentation:
1.  Retrieves semantic chunks from the vector database (e.g. pgvector or Milvus).
2.  Merges the retrieved context into the templates' `{context}` variable.
3.  Executes the model gateway, logging the complete interaction in `InferenceLog`.
