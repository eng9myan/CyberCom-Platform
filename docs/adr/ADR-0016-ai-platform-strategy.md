# ADR-0016: AI Platform Strategy

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-21 |
| **Deciders** | Chief Software Architect, Chief Security Architect, Principal Engineer (Data), Compliance Architect, Platform Architect |
| **Affects** | CyAI (the AI product); every product that embeds AI; AI used by engineers (Claude Code, Antigravity, ChatGPT) |
| **Tags** | ai, ml, platform, security, compliance |
| **Related** | [ADR-0015](ADR-0015-reporting-analytics-strategy.md), [ADR-0005](ADR-0005-identity-access-management-strategy.md), [ai_assistants_in_platform](../governance/ai_assistants_in_platform.md), [security_architecture](../security/security_architecture.md) |

---

## 1. Context

AI ("classical" ML + modern LLMs) will be embedded in CyMed (clinical decision support, summarization), CyCom (assistants), CyShop (search/recommendations), CyGov / CyCitizen (services), and platform-internal tooling (CyAI). Without a shared platform, every product will pick its own model, vector store, eval harness, and governance — and we will fail audits.

## 2. Problem Statement

How does CyberCom build, serve, evaluate, and govern AI capabilities — classical and generative — across the platform, in a way that is portable, auditable, and safe for regulated domains?

## 3. Decision Drivers

- One platform for both **classical ML** and **GenAI / LLM agents**.
- Multi-provider, multi-model — including **open-weights for sovereign / on-prem**.
- HIPAA / GDPR posture: no production PHI/PII in unvetted prompts; lawful basis; auditability of every AI decision.
- Tight integration with the Feature Store / lakehouse ([ADR-0015](ADR-0015-reporting-analytics-strategy.md)).
- Standards-based observability + evaluation; "the model worked in dev" is not a release criterion.
- Human-in-the-loop and **clinical-grade safety** for healthcare use cases.

## 4. Considered Options

1. **CyAI platform: model gateway + registry + feature store + RAG + agent framework + eval + guardrails, vendor-and-OSS-portable** (chosen).
2. Single-vendor LLM stack (OpenAI or Anthropic) embedded directly per product.
3. Per-product AI freedom.

## 5. Decision

CyberCom builds **CyAI** as a platform offering with the following building blocks. Every block has both **managed-vendor** and **self-hostable OSS** options so the same stack runs in SaaS, private cloud, and sovereign on-prem.

### 5.1 Building blocks

| Block | Purpose | Default tools |
|---|---|---|
| **Model gateway** | Single front door to every model (LLM, embeddings, ASR, vision, classical) | OSS: LiteLLM / vLLM behind an internal gateway. Managed: native vendor APIs proxied through CyAI gateway |
| **Model registry** | Catalog of models, versions, capabilities, licenses, evals, owners | MLflow / OpenMetadata + internal CyAI registry |
| **Feature store** | Online + offline features from CyData (per [ADR-0015](ADR-0015-reporting-analytics-strategy.md)) | Feast (OSS) or managed equivalent |
| **Vector store** | Embeddings for RAG, semantic search | **pgvector** for small/medium; OpenSearch / Qdrant / Milvus for large scale (per ADR per use case) |
| **RAG framework** | Retrieval pipelines (chunking, embedding, retrieval, reranking, prompt assembly) | LangChain / LlamaIndex / Haystack — single choice per use case, encoded in CyAI templates |
| **Agent framework** | Tool-using agents with typed tools, traces, and policy hooks | OSS framework (LangGraph / OpenAI Agents SDK / custom) wrapped by CyAI for guardrails |
| **Training & fine-tuning** | Periodic supervised / DPO / LoRA jobs | Ray + PyTorch on K8s; vendor fine-tune APIs where appropriate |
| **Evaluation** | Offline benchmarks + online evals (LLM-as-judge, A/B, human-in-the-loop) | Promptfoo / DeepEval / custom; results stored in registry |
| **Observability** | Traces of prompts, retrievals, tool calls, latencies, cost | OpenTelemetry-native; integrates with platform observability ([ADR-0009](ADR-0009-observability-strategy.md)) |
| **Guardrails** | Input validation, PHI/PII detection, prompt-injection defense, output policy, toxicity, jailbreak | LLM-guardrails library + policy engine ([ADR-0005](ADR-0005-identity-access-management-strategy.md)) |
| **Data labelling** | Human labels for evals + fine-tuning | Argilla / Label Studio + tenant-scoped workflows |

### 5.2 Model strategy

- **Provider-portable.** No product hard-codes a single provider. Choice is driven by capability + cost + residency.
- **Tiered model use:**
  - **Hosted frontier models** for general reasoning and CyMed/CyGov features that benefit from quality (Claude, GPT, Gemini families) — used **only** where the data path is contractually allowed.
  - **Open-weights** (Llama, Mistral, Qwen, Falcon families) self-hosted via vLLM for sovereign / on-prem / PHI workloads.
  - **Domain-specific** (medical, legal, code) models considered on merit; require eval evidence and an ADR per production use.
  - **Small / efficient** models (1–8B) for classification, extraction, routing — preferred where they suffice.
- **Model versions pinned**; promotions require eval delta + sign-off.

### 5.3 Data flows & privacy

- **No production PHI/PII leaves the regulated boundary** unless a signed BAA / DPA exists with the model provider **and** the data-flow ADR for that feature approves it.
- **Default for healthcare and government:** self-hosted open-weights or BAA-covered vendor endpoints; never general-purpose consumer APIs.
- **Prompt + completion logs** redacted at source; minimum-necessary fields persisted; per [`audit_logging_strategy`](../security/audit_logging_strategy.md).
- **Training data** governed by data contracts; lineage in OpenLineage; consent + lawful basis recorded.
- **Retention** for prompts/completions defaults to short (e.g. 30 days hot, 1 year cold) — overridden upward only by regulation.
- **No real customer data in evals** without de-identification.

### 5.4 RAG pattern (default)

- Sources connect into CyData Gold layer or a curated knowledge index; **no direct OLTP read**.
- Embeddings refreshed on source updates via event stream; versioned.
- Retrieval results carry **provenance** (source IDs, scores) into the prompt context and the response audit log.
- Answers expose **citations** to source documents wherever feasible.
- Per-tenant indexes; cross-tenant retrieval forbidden.

### 5.5 Agents

- Agents are **typed tools** with schemas; tools wrap CyberCom APIs (FHIR, ERP, etc.).
- Tool calls go through CyIdentity authN/Z; agents inherit the requesting user's scope; **no agent acts as admin**.
- All tool calls audited; high-risk tools require human confirmation step (HITL).
- Long-running agents run as bounded jobs with cost + step budgets.

### 5.6 Evaluation & release gates

- Every AI feature has an **eval suite** (offline) committed in the repo; promotions across envs require:
  - Eval score ≥ baseline (no regression beyond budget).
  - Safety evals (red-team prompts, PII leak, jailbreak) within thresholds.
  - For healthcare: clinician review on a sampled set; documented in release PR.
- **Online evals**: shadow / A/B with guardrails; rollback on metric breach.
- Eval reports archived per release; serve as compliance evidence.

### 5.7 Safety & guardrails

- **Input:** schema validation; PHI/PII detection; prompt-injection defense (instruction hierarchy, tool-call allowlist, content filters).
- **Output:** policy filter (toxicity, self-harm, regulated advice gating); citation requirement for factual claims; refusal patterns for out-of-scope.
- **Misuse / abuse:** rate limits per user/tenant; anomaly detection on prompt patterns.
- **Hallucination management:** RAG-first for factual tasks; confidence + abstention encouraged over fabrication.
- **For clinical features specifically:** decision support, not autonomy; explicit "advisory" framing; documented intended-use and contraindications; aligned to FDA SaMD / EU MDR pathways where applicable.

### 5.8 Observability & cost

- OpenTelemetry traces per request: model id, tokens (in/out), latency, retrieval results (IDs only), tool calls, guardrail outcomes.
- Per-tenant + per-feature cost dashboards; budgets and alarms.
- Quality metrics (groundedness, citation rate, refusal rate, user thumbs-up/down) tracked over time.

### 5.9 Engineer-facing AI

- **Engineer-facing AI assistants** (Claude Code, Antigravity, ChatGPT) are governed by [`ai_assistants_in_platform`](../governance/ai_assistants_in_platform.md). That doc is in scope of this ADR — common policies (no PHI/PII in prompts, human accountability, disclosure via `Co-authored-by`) apply to **both** product AI and engineer AI.

## 6. Rationale

- A platform layer prevents per-product fragmentation and gives one auditable surface for compliance.
- Multi-provider portability is essential for sovereign and PHI workloads; open-weights cover the on-prem case.
- RAG + evals + guardrails are the minimum viable safety harness; bolting them on later is more expensive.
- Tying AI to CyData Gold + Feature Store ensures consistent semantics with the rest of the platform.

## 7. Consequences

### 7.1 Positive
- One mental model and one toolchain for AI work.
- Vendor swaps don't touch product code.
- Evals + audit produce real compliance evidence.

### 7.2 Trade-offs
- Building the gateway/registry/eval surface is non-trivial; staged via the platform roadmap.

### 7.3 Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | PHI leaked into non-BAA vendor APIs | Medium | Critical | Default-deny vendor routing for PHI; guardrails detect PHI in prompts; data-flow ADR per feature |
| 2 | Hallucinations cause clinical/financial harm | Medium | Critical | RAG-first with citations; HITL for high-risk actions; clinical-feature SaMD pathway; refusal patterns |
| 3 | Prompt injection exfiltrates data via tool calls | Medium | High | Tool-call allowlists; instruction hierarchy; output sanitization; OPA/Cedar on every tool |
| 4 | Vendor lock-in via proprietary features | Medium | Medium | Model gateway abstraction; OSS-equivalent path required for every feature |
| 5 | Cost runaway from agent loops | High | Medium | Per-feature step + token budgets; alarms; circuit-breakers |
| 6 | Eval coverage too thin → false confidence | High | High | Mandatory eval suite + safety evals; sample-based human review per release |
| 7 | Vector index drift / staleness | Medium | Medium | Event-driven re-embedding; freshness SLOs per index |
| 8 | Training-data contamination / leakage | Medium | High | Lineage in OpenLineage; de-identified training sets only; periodic memorization tests |
| 9 | Open-weights performance gap vs hosted frontier | High | Medium | Tier features by required capability; reserve frontier for narrow, BAA-allowed use cases |
| 10 | Regulatory shifts (EU AI Act, FDA SaMD, MOH) | High | High | Compliance Architect tracks; high-risk features documented per regime; risk classifications maintained |

### 7.4 Follow-up actions
- [ ] Author **CyAI reference architecture** in `docs/architecture/` — Principal Engineer (Data) + Platform Architect, Program 2 Sprint 1.
- [ ] Stand up the **model gateway** (LiteLLM/vLLM behind internal gateway) — Platform Eng, Program 2 Sprint 2.
- [ ] Author **eval framework + clinical-feature pathway** doc — QA Architect + Healthcare Domain Architect, Program 2 Sprint 2.
- [ ] Author **AI data-flow ADR template** per AI feature — Compliance Architect, Program 2 Sprint 2.
- [ ] Implement **PHI/PII guardrail** library and publish as paved-road package — Security + Data, Program 2 Sprint 3.

## 8. Compliance & Security Impact

- HIPAA: only BAA-covered vendor endpoints touch PHI; self-hosted otherwise; all access audited.
- GDPR: lawful basis recorded per feature; right-to-erasure propagates to training datasets and indexes; cross-border transfer controlled.
- EU AI Act: each AI feature receives a risk classification (minimal / limited / high / unacceptable) recorded in the registry; high-risk features carry the additional controls required.
- FDA SaMD / EU MDR: clinical decision-support features follow the SaMD pathway with documented intended use, validation, and post-market surveillance.
- Audit: every AI decision carries actor, model id + version, prompt hash, retrieval IDs, tool calls, outcome.

## 9. Alternatives Rejected

- **Single-vendor LLM** — fastest to ship but incompatible with sovereign / on-prem and creates outsized lock-in for clinical/government work.
- **Per-product freedom** — guarantees fragmented evals, inconsistent safety, fragile compliance.

## 10. References

- [`ai_assistants_in_platform`](../governance/ai_assistants_in_platform.md), [`audit_logging_strategy`](../security/audit_logging_strategy.md), [`security_architecture`](../security/security_architecture.md)
- EU AI Act; FDA Software as a Medical Device guidance; NIST AI Risk Management Framework

---

## Revision History
| Date | Author | Change |
|---|---|---|
| 2026-06-21 | Chief Software Architect | Proposed |
| 2026-06-21 | Architecture Board | Accepted |
