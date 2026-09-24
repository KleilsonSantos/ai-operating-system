# Free-tier cloud providers (operator guide)

Thin aliases over the OpenAI-compatible client ([ADR-0016](../adr/0016-openai-compatible-provider.md), [ADR-0035](../adr/0035-free-tier-provider-aliases-failover.md)).  
**Free for development ≠ free recurring capacity ≠ production SLA.**

## Providers

| Id           | Default base URL                                          | Key env (first wins)                                        | Default model        |
| ------------ | --------------------------------------------------------- | ----------------------------------------------------------- | -------------------- |
| `openrouter` | `https://openrouter.ai/api/v1`                            | `AIOS_OPENROUTER_API_KEY` / `OPENROUTER_API_KEY`            | `openrouter/free`    |
| `groq`       | `https://api.groq.com/openai/v1`                          | `AIOS_GROQ_API_KEY` / `GROQ_API_KEY`                        | `openai/gpt-oss-20b` |
| `gemini`     | `https://generativelanguage.googleapis.com/v1beta/openai` | `AIOS_GEMINI_API_KEY` / `GEMINI_API_KEY` / `GOOGLE_API_KEY` | `gemini-2.5-flash`   |
| `openai`     | `https://api.openai.com/v1`                               | `AIOS_OPENAI_API_KEY` / `OPENAI_API_KEY`                    | `gpt-4o-mini`        |
| `ollama`     | `http://127.0.0.1:11434`                                  | (none)                                                      | `llama3.2`           |

Override base URL / model with `AIOS_<ALIAS>_BASE_URL` and `AIOS_<ALIAS>_MODEL`.

```bash
# Example: coding class → Gemini, with free-tier hop then local
export AIOS_GEMINI_API_KEY=…
export AIOS_GROQ_API_KEY=…
export AIOS_OPENROUTER_API_KEY=…

export AIOS_ROUTE_CODING_PROVIDER=gemini
export AIOS_ROUTE_FALLBACK=groq,openrouter,ollama
export AIOS_ROUTE_FAILOVER=1
```

```ts
import { getProvider, routeModel, chatWithRouteFailover } from '@aios/provider';

const decision = routeModel({ intentKind: 'explain.code' });
// decision.fallbacks is filled from AIOS_ROUTE_FALLBACK (no network)

const out = await chatWithRouteFailover(decision, {
  messages: [{ role: 'user', content: 'ping' }],
});
```

Health / single-provider chat still work:

```bash
aios --provider-health --provider=groq
aios --provider-chat --provider=openrouter --model=openrouter/free
```

## Rules of the road

1. **One legitimate account / API key per provider.** Do not multi-account to multiply quotas.
2. **Do not treat free tiers as SLA.** Keep `ollama` (or a paid key) in the fallback chain for real work.
3. **Privacy:** Gemini Free may use prompts/responses to improve Google products. Use `privacy: sensitive` (forces local) for private code/secrets ([ADR-0031](../adr/0031-task-profile-model-router.md)).
4. **Limits change.** Read each vendor’s rate-limit console; AIOS does not hard-code RPM/TPM as truth.
5. **Do not resell** free-tier access as your own public API without checking each provider’s terms.

## Out of scope here

Live quota dashboards, Hugging Face credits, Cloudflare Neurons, Mistral as a first-class alias (reuse `openai` + custom `AIOS_OPENAI_BASE_URL` if needed).
