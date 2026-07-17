# Critique: Mary scoring v5

## 1. Score the RFC

*   **Problem framing: 4/5**
    *   The business problem (missing tail revenue due to rigid gate scoring) is clearly defined and anchored in a real incident (L009).
*   **Evidence quality: 1/5**
    *   A sample size of 14 historical conversations is statistically insignificant for validating a production scoring model that replaces deterministic logic.
*   **Architectural fit: 3/5**
    *   Moving to a unified LLM call reduces code complexity, but introduces significant observability and latency trade-offs that are not fully addressed.
*   **Migration risk: 2/5**
    *   14 days of parallel running is insufficient to observe rare tail events, and decommissioning the old system at month 3 removes the fallback too early.
*   **Recommendation supportability: 2/5**
    *   The core idea (contextual scoring) is strong, but the evidence and risk mitigations presented do not support shipping a full replacement to production in 6 weeks.

## 2. Load-Bearing Claims

1.  **"Confidence calibration enables tail detection" (LLMs can output meaningful confidence intervals)**
    *   **Evidence does not support.** LLMs are notorious for being poorly calibrated when asked to self-report raw numerical confidence intervals. A Brier score of 0.18 on a sample of 14 is statistical noise, not proof of reliable calibration.
2.  **"Tail detection improved 3.6x in the sample — sufficient to expect this would have caught L009-shaped opportunities"**
    *   **Evidence does not support.** In a sample of 14, an increase from 14% to 50% represents a shift of roughly 5 conversations. This is anecdotal evidence, not a reliable commercial signal for enterprise revenue routing.
3.  **"Temperature 0 eliminates sample-to-sample variance"**
    *   **Evidence does not support.** Temperature 0 reduces variance but does not guarantee strict determinism in modern LLM APIs due to floating-point math on distributed GPUs. Furthermore, it completely ignores "prompt-sensitivity variance," where slight input phrasing changes drastically shift the score.
4.  **"Without per-gate scoring, we don't need to A/B individual signal weights because the LLM contextualizes them."**
    *   **Evidence does not support.** Delegating all weighting to the LLM destroys our observability. If a future foundation model update suddenly starts ignoring the "Volume" signal, we have no deterministic telemetry to detect it until revenue drops.

## 3. What's Missing

*   **A Hybrid / "LLM-as-a-Gate" Alternative:** The author jumped straight to "replace everything" instead of proposing adding an "LLM Context Score" alongside the existing 5 deterministic gates. A hybrid approach would preserve existing observability while catching the L009 tail cases.
*   **Fallback & Latency Strategy:** Replacing simple arithmetic with an LLM API call introduces latency spikes and API downtime risks. There is no mention of timeout handling or a fallback scoring mechanism if the LLM provider experiences an outage. This is not a theoretical concern — if the LLM API goes down and no fallback exists, the routing system will silent-fail. Leads worth $500K+ could be misrouted to a cold nurture bucket simply because no score was produced. This makes Fallback a load-bearing architectural requirement, not a nice-to-have.
*   **Systematic Prompt Evaluation:** The RFC assumes the prompt works based on 14 manual runs, but lacks a framework for regression testing (e.g., golden datasets, LLM-as-a-judge pipelines) to ensure future prompt tweaks don't break existing routing logic.

## 4. Decision

**Decision: send-back-to-author**

While the core insight—that deterministic gates miss nuanced, high-value tail opportunities like L009—is correct, the proposed execution introduces unacceptable production risks. The proposal's conclusions outrun its evidence: every major claim rests on a sample of 14 conversations, which is not a foundation you ship a revenue-routing engine on.

Specifically, the author trusts the LLM too much and the data too little. Relying on an LLM to self-report mathematical confidence intervals is a known anti-pattern in production ML systems — LLMs are text generators, not statistical estimators, and treating their numerical outputs as calibrated probabilities is a category error. Validating a core revenue-routing engine on a sample size of 14 is statistically reckless; at that scale, a single misclassified conversation swings the "tail detection" metric by 7 percentage points. Furthermore, completely decommissioning the deterministic scoring system removes our baseline observability and leaves us entirely dependent on the opaque internal weighting of a third-party model. A hybrid architecture — where the LLM acts as a 6th contextual gate alongside the existing five — would capture the L009-shaped upside while preserving the deterministic telemetry that lets us detect silent regressions before they hit revenue.

**Before this can be approved, the author must:**
1. Expand the evaluation dataset from 14 to at least 500 historical conversations, ensuring a representative distribution of Hot/Warm/Cold and known "tail" deals.
2. Rewrite the proposal as a *Hybrid Architecture* where the LLM either acts as a 6th gate or acts as an override/escalation system for borderline cases, rather than a full replacement.
3. Provide a robust framework for continuous evaluation (observability) since we are losing deterministic gate metrics.

## 5. Debrief Questions

1. "You reported a Brier score of 0.18 on 14 samples. How exactly did you map the LLM's text-based '75 ± 12' output to actual probability distributions to calculate that score?"
2. "If the LLM scores a lead 'Hot' but the natural language rationale contradicts our hard minimum volume requirements, how do we debug or tune that specific failure mode without breaking other contextual weightings?"
3. "L009 scored Warm because it had a strong importer profile but weak portal engagement. In the new system, what stops the LLM from making the same error differently — for example, over-indexing on the natural language in the conversation transcript and ignoring weak quantitative signals like portal activity?"
4. "Your proposal hardcodes Claude Sonnet 4.5. If Anthropic deprecates that model in 6 months — which has happened before — what's your migration plan? How do you re-validate scoring consistency across a model swap without the deterministic baseline you've already decommissioned?"
