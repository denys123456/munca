# AI Integration

Generative AI is used only for natural-language explanation:

- personalized advisor feedback
- manager summaries
- sales recommendations
- alert explanations
- next-best actions

Deterministic decisions remain in Java:

- points calculation
- gamification level
- authorization
- sales totals
- target progress
- reward eligibility

The backend depends on `AiClient` because LLM providers are external systems that may change. If the provider is unavailable, dashboards still work and display fallback recommendations.

The frontend does not present AI outages as global application failures. AI availability is shown only inside insight areas where generated content is expected.
