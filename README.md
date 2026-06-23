# Northern Coast Lead Scoring Agent

This is a deployed HTTP endpoint for scoring B2B beverage inbound leads.

## Time Spent
**~30 minutes**
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
The endpoint handles the 3 core scenarios smoothly:

1. **Hot Example (S001)**
   - *Input:* UAE distributor, 3 FCL/month Red Bull, 8 years importing.
   - *Result:* High Score, Tier: **Hot**, Routing: `kam_handoff`.
2. **Cold Example (S002)**
   - *Input:* "hey can I get a few cans of red bull for my office party"
   - *Result:* Low Score, Tier: **Cold**, Routing: `auto_archive`.
3. **Ambiguous Example (S003)**
   - *Input:* Ghana-based distributor... New entrant, license in process... 1 FCL/month.
   - *Result:* Mid Score, Tier: **Warm**, Routing: `nurture_pool`. (LLM correctly recognizes the potential but flags the pending license).

## With More Time
If I had more time to refine this system, I would:
- **Implement Pydantic-like Structured Schemas:** Enforce the exact JSON Schema natively in the Gemini SDK configuration for 100% robust type safety, rather than relying heavily on the text prompt.
- **Add Tracing / Logging:** Integrate Langfuse or Helicone to trace LLM inputs/outputs, monitor latency, and track cost per request.
- **Resilience:** Implement a retry mechanism with exponential backoff and a fallback LLM (e.g., GPT-4o-mini) if the primary API call fails.
- **Security:** Secure the `/api/score` endpoint using Bearer tokens (API Keys) instead of leaving it fully open.
