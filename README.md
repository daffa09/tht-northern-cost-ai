# Northern Coast Lead Scoring Agent

This is a deployed HTTP endpoint for scoring B2B beverage inbound leads.

**🌍 Live API Documentation (Swagger):** 
[https://tht-northern-cost-ai.vercel.app/api-docs/](https://tht-northern-cost-ai.vercel.app/api-docs/)

**🚀 Base API Endpoint:**
`https://tht-northern-cost-ai.vercel.app/api/score`

---

## Time Spent
**~15 minutes**
The implementation was fast and straightforward. I relied on AI tooling to quickly bootstrap the Vercel + Express setup and generate the initial scoring prompt.

## Model Choice & Engineering
This application uses **Gemini 2.5 Flash** (`gemini-2.5-flash`) via the official Google GenAI SDK. 
I chose this model over Claude because:
1. **Speed**: The flash variant is exceptionally fast (ideal for an API that must return within 30 seconds).
2. **Structured Outputs**: Gemini has excellent native support for `responseMimeType: "application/json"`.
3. **Context Reasoning**: It demonstrates strong reasoning capabilities to correctly identify implicit business signals (e.g. recognizing "cans for a party" as retail vs "FCL" as B2B).

**Engineering Decisions & Bug Fixes:**
During testing, we noticed that even when forcing `application/json`, the LLM would occasionally wrap its output in Markdown backticks (e.g., ````json { ... } ````). This caused `JSON.parse` to throw an `Unexpected non-whitespace character after JSON` error. To resolve this robustly, we implemented a Regex step (`rawText.match(/\{[\s\S]*\}/)`) that strictly extracts only the raw JSON payload, ignoring any surrounding markdown or commentary.

## Test Scenarios Evaluated
The endpoint handles the 3 core scenarios smoothly. You can test them using the following JSON payloads:

### 1. Hot Example (S001)
**Result:** High Score, Tier: **Hot**, Routing: `kam_handoff`.
```json
{
  "lead_id": "S001",
  "channel": "whatsapp",
  "conversation": [
    {"role": "lead", "text": "UAE distributor, 3 FCL/month Red Bull, 8 years importing energy drinks. Looking for original Austrian product."},
    {"role": "agent", "text": "Volume target on Red Bull specifically?"},
    {"role": "lead", "text": "2-3 FCL/month sustained. ~250 retail accounts across UAE."}
  ]
}
```

### 2. Cold Example (S002)
**Result:** Low Score, Tier: **Cold**, Routing: `auto_archive`.
```json
{
  "lead_id": "S002",
  "channel": "email",
  "conversation": [
    {"role": "lead", "text": "hey can I get a few cans of red bull for my office party"}
  ]
}
```

### 3. Ambiguous Example (S003)
**Result:** Mid Score, Tier: **Warm**, Routing: `nurture_pool`. (LLM correctly recognizes the potential but flags the pending license).
```json
{
  "lead_id": "S003",
  "channel": "email",
  "conversation": [
    {"role": "lead", "text": "Ghana-based distributor looking for Coca-Cola products. New entrant, license in process — expected 6 weeks. Initial volume 1 FCL/month."}
  ]
}
```

