<div align="center">

<br/>

<img src="public/og-banner.png" alt="AegisGate — One gate. Every model. Total control." width="100%"/>

<br/>
<br/>

# ⟡ AegisGate

**One gate. Every model. Total control.**

*Guardrails · Red Teaming · Evaluation — as a service, for any LLM*

<br/>

[![p50 scan latency](https://img.shields.io/badge/p50_scan-41ms-0b0f14?style=for-the-badge&labelColor=0b0f14&color=38E1C6)](https://github.com/ranjan-sumit/agentgate)
[![attack strategies](https://img.shields.io/badge/attack_strategies-40%2B-0b0f14?style=for-the-badge&labelColor=0b0f14&color=9B7BFF)](https://github.com/ranjan-sumit/agentgate)
[![OWASP LLM Top 10](https://img.shields.io/badge/OWASP-LLM_Top_10_mapped-0b0f14?style=for-the-badge&labelColor=0b0f14&color=red)](https://github.com/ranjan-sumit/agentgate)
[![React 19](https://img.shields.io/badge/React-19-0b0f14?style=for-the-badge&labelColor=0b0f14&logo=react)](https://github.com/ranjan-sumit/agentgate)
[![License: MIT](https://img.shields.io/badge/license-MIT-0b0f14?style=for-the-badge&labelColor=0b0f14&color=blue)](https://github.com/ranjan-sumit/agentgate)

<br/>

</div>

---

<br/>

## ⟡ What is AegisGate?

**AegisGate** is a ground-up re-engineering of **Azure AI Foundry's safety stack** — Content Safety guardrails, the AI Red Teaming Agent (PyRIT), and the Evaluation studio — rebuilt as an independent, **model-agnostic gate-as-a-service**. The best ideas from Lakera, AWS Bedrock Guardrails, NVIDIA NeMo Guardrails, Cisco AI Defense, and Meta LlamaFirewall are folded in.

This repo ships a complete, working **frontend console** with three client-side engines (`ScanEngine` · `RedTeamEngine` · `EvalEngine`) that faithfully mirror the real API contracts.

<br/>

```
                ┌────────────────  CONTROL PLANE  ────────────────┐
                │   Policy Studio  ·  Red Team  ·  Eval Studio    │
                └───────────────────────┬─────────────────────────┘
                                        │  versioned policy bundle
                ┌───────────────────────▼─────────────────────────┐
                │                 DATA PLANE                      │
                │   POST /v1/scan                 verdict API     │
                │   POST /v1/chat/completions     gated proxy     │
                │   SDKs · LiteLLM · LangChain · Kong / WASM      │
                └─────────────────────────────────────────────────┘
```

<br/>

---

<br/>

## ⟡ Why not just use Azure Foundry?

We back-tracked Foundry — and fixed its gaps.

| Foundry limitation | ⟡ AegisGate answer |
|:---|:---|
| Prompt Shields return only a boolean | **Subtype + confidence score** on every shield verdict |
| PII is block-or-nothing | **Mask/redact mode** — redact inline, let the request proceed |
| Custom categories can't combine with default harms | **All blocks compose** in a single `/v1/scan` |
| Red-team targets limited to Azure | **Any HTTP endpoint** is a valid target |
| No OWASP / ATLAS mapping in-product | **OWASP LLM Top 10 + MITRE ATLAS** on every scorecard |
| Run comparisons are ephemeral | **Persistent comparisons** with t-test significance badges |
| Advanced features English-only | Multilingual by design |

<br/>

---

<br/>

## ⟡ The Console — seven surfaces

<table>
<tr>
<td width="50%">

#### 🛡 Gate
Scanner playground — input / output / document / image channels, 0-2-4-6 severity meters, Prompt Shields with subtype + confidence, PII masking, groundedness spans, raw JSON, View-Code export.

#### ⚙ Policy Studio
8 composable policy blocks, severity band sliders, annotate / block / mask per block, regex blocklist editor, draft-policy live testing, versioned publish + diff, live Policy-as-Code YAML.

#### ⚔ Red Team Lab
4-step scan wizard, 11 risk categories, Easy → Difficult strategy tiers (Base64 … Crescendo / TAP), live terminal log, ASR scorecards, risk × complexity heat matrix, judge-reason transcripts, regression-set export.

</td>
<td width="50%">

#### 🧪 Evaluation Studio
Evaluator catalog (quality / RAG / safety / agent / composite / custom), run wizard, results drill-down with histograms, persistent baseline comparison with p-values, continuous-eval sampling rules.

#### 📈 Observability
Ticking KPIs, severity / latency / verdict charts, live scan feed, incident queue, OTel GenAI trace waterfall with harvest-to-dataset, alert rules.

#### 🔌 Integrations
API keys with one-time reveal, quickstarts, OpenAI-compatible gated proxy, gateway plugin cards, OWASP / ATLAS / NIST / EU AI Act compliance mapping.

</td>
</tr>
</table>

<br/>

---

<br/>

## ⟡ Architecture

```
src/
├── engines/                 the brains — client-side simulation of the real services
│   ├── ScanEngine.ts        → mirrors POST /v1/scan · harms, shields, PII, groundedness
│   ├── RedTeamEngine.ts     → seed objectives → converters → judge → ASR scorecard
│   └── EvalEngine.ts        → evaluator catalog · metric distributions · p-value compare
│
├── components/
│   ├── primitives/          VerdictBadge · SeverityMeter · StatCard · DataTable · CodeBlock
│   ├── ConsoleShell.tsx     240px console sidebar + top bar
│   └── home/                HeroCanvas (R3F particles) · LiveDemo
│
└── pages/                   Home · Gate · Policies · RedTeam · Evaluations · Observability · Integrations
```

> **Design system** — `#07090D` base · teal `#38E1C6` brand · violet `#9B7BFF` adversarial · Inter + JetBrains Mono · GSAP pinned sequences · Lenis smooth scroll · Framer Motion springs

<br/>

---

<br/>

## ⟡ Quickstart

```bash
git clone https://github.com/ranjan-sumit/agentgate.git
cd agentgate
npm install --legacy-peer-deps
npm run dev          # → http://localhost:5173
```

```bash
npm run build        # production build → dist/
```

<br/>

---

<br/>

## ⟡ The API we're designing toward

```bash
curl -X POST https://api.aegisgate.dev/v1/scan \
  -H "Authorization: Bearer $AEGIS_KEY" \
  -d '{ "channel": "input", "policy": "prod-default-v3", "text": "..." }'
```

```json
{
  "verdict": "blocked",
  "prompt_shield": { "attackDetected": true, "subtype": "encoding", "confidence": 0.97 },
  "harm": { "violence": { "severity": 4, "confidence": 0.91 } },
  "pii": { "action": "masked", "masked_text": "My card is [CARD_NUMBER]" },
  "latency_ms": 38
}
```

<br/>

---

<br/>

## ⟡ Research lineage

Re-engineered from **Azure AI Content Safety** (`/contentsafety/` surface · severity quantization · Prompt Shields) — **Azure AI Red Teaming Agent + PyRIT** (converters · orchestrators · ASR scorecards) — **azure-ai-evaluation** (evaluator taxonomy · run comparison) — plus ideas from **Bedrock Guardrails** (ApplyGuardrail · PII masking), **NeMo Guardrails** (OpenAI-compatible proxy), **Lakera** (confidence-scored verdicts), **Cisco AI Defense** (red-team → runtime closed loop), and **LlamaFirewall** (agent-native rails).

<br/>

---

<div align="center">

<sub>Built as a deep-research + multi-agent engineering exercise.</sub>

<sub>**MIT licensed — contributions welcome**</sub>

</div>
