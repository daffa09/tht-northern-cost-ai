# WhatsApp at Scale — Architecture Recommendation

## 1. Recommendation

Migrate the main BSD number to the **WhatsApp Business Platform (Cloud API)** via **[360dialog](https://www.360dialog.com/)** as the BSP. For the 4 KAM numbers, use **WhatsApp Coexistence** so each KAM keeps using the native WhatsApp Business App on their phone while the same number is also connected to the Cloud API. All conversation data flows via webhooks into our owned CDP — no SaaS inbox, no desktop agent tool, and no workflow that forces KAMs off their phones.

---

## 2. Load-Bearing Constraints

These are the constraints that actually eliminate options, not soft preferences.

| Constraint | Eliminates |
|---|---|
| KAMs must keep WAB on their phones | Shared-inbox-only architectures that require desktop agents |
| We must own the conversation data | Closed inbox SaaS that keeps conversations in its own UI/database |
| Scale to ~10K outbound/day | The native mobile WhatsApp Business App by itself |
| No scraping or unofficial tooling | Baileys, whatsapp-web.js, and similar TOS-risk paths |

The KAM constraint is the hardest one. It rules out the obvious enterprise answer — "one number + shared inbox + agent routing" — because that would force KAMs into a desktop workflow. Coexistence is the only clean way to preserve the phone-native KAM workflow while still getting API access to the same number.

---

## 3. Vendor & Architecture Path

**BSP:** [360dialog](https://www.360dialog.com/) — supports Coexistence, Embedded Signup, and webhook-based capture of messages and history sync.

**Pricing** (monthly, per channel — from [360dialog pricing](https://www.360dialog.com/pricing)):

| Plan | Monthly Cost | Notes |
|---|---|---|
| Regular | €49 / $59 | Standard support |
| Premium | €99 / $119 | <30min first response |
| Higher Throughput | €249 / $299 | Up to 1,000 msg/sec |

Meta conversation fees are billed separately at cost — 360dialog does not add a markup.

**Architecture:**

```
[Main BSD Number]
→ Cloud API via 360dialog
→ outbound campaigns / inbound triage
→ webhook → owned CDP

[Each KAM Number x4]
→ WhatsApp Coexistence via 360dialog
→ KAM keeps native WAB on their phone, unchanged
→ messages echoed to webhook in real time
→ data written directly into owned CDP
```

**Why 360dialog specifically:** Their docs confirm Coexistence is built for businesses already on WAB who want to expand to Cloud API. Meta's Embedded Signup flow is the onboarding mechanism. 360dialog also documents message echoes and history sync for Coexistence users — this is the key mechanism for keeping conversation data owned and queryable.

> ⚠️ **Important limitation:** Coexistence requires the number to have been actively used on the WhatsApp Business App for at least 7 days, the latest WAB app version, and the number must not be from a restricted region. The WAB app must also be opened at least once every 13 days to keep the account active. Numbers with **OBA status (Official Business Account / blue checkmark) are not supported** for Coexistence.

---

## 4. Defensive Pilot Plan

**Goal:** Prove that Coexistence works on a test number before touching any live KAM number.
**Budget cap:** ~€500, hard stop if setup friction or fees exceed this.
**Timeline:** 14 days.

| Day | Action | Success Signal |
|---|---|---|
| 1–2 | Provision a spare test number. Install latest WAB app. | Number active and eligible |
| 3–5 | Confirm number meets Coexistence prerequisites | 7+ days active WAB, latest app version, no restricted-region flag |
| 6–7 | Run 360dialog Embedded Signup for Coexistence | Onboarding completes successfully |
| 8–9 | Send messages from the phone, verify message echoes at webhook | Echoes arrive in real time, land in test CDP |
| 10–11 | Connect the main BSD flow and test outbound API sends | Delivery, quality, and webhook capture are all stable |
| 12–14 | End-to-end test: inbound → triage → KAM handoff → KAM replies from phone | Full loop works without forcing KAM off WAB |

**Kill criteria — stop and switch paths if:**
- The number fails Coexistence eligibility
- Message echoes do not arrive reliably
- The workflow breaks the phone-native KAM experience
- A region/account rule makes live rollout non-repeatable across KAM numbers

---

## 5. Phase 1 Rollout (First 30 Days Post-Pilot)

| Week | Ships | Stays Manual |
|---|---|---|
| Week 1 | Production CDP webhook pipeline for BSD number | Routing rules for KAM assignment |
| Week 2 | Main BSD migrates off ManyChat → 360dialog Cloud API | AI draft replies for KAM approval (limited to pilot scope) |
| Week 3 | KAM 1 + KAM 2 moved to Coexistence | Manual fallback for escalations |
| Week 4 | KAM 3 + KAM 4 moved to Coexistence | Sequential rollout of new templates and outbound ramps |

**Acceptance criteria for end of Phase 1:**
- All 5 numbers visible in the CDP
- Webhooks reliably capture both app-originated and API-originated messages
- BSD outbound scales to 10K/day without quality degradation
- KAMs still operate entirely from their phones

---

## 6. What to Verify Before Signing

Three things to confirm before committing — couldn't be fully validated in 1 hour:

1. **Per-number eligibility** — Each KAM number must satisfy the 7-day active WAB requirement and pass account-quality checks before Coexistence onboarding. Needs verification number-by-number.

2. **Restricted-region handling** — Confirm whether any current or future KAM numbers fall into a restricted region under 360dialog's Coexistence rules, given our leads span 60+ countries.

3. **Commercials and throughput tier** — Confirm which subscription tier each number actually needs, and what the true total monthly cost looks like once Meta conversation fees are added at real volume.

---

## 7. Considered and Rejected

**Path A: One BSD number + shared inbox (respond.io, Trengo, Zendesk)**
The default enterprise pattern. Fails the hard constraint that KAMs must stay on their phones. A desktop inbox would make the operating model worse, not better. Rejected.

**Path B: Unofficial WhatsApp Web automation (Baileys, whatsapp-web.js)**
Can preserve a phone-like feel short term. Creates TOS and ban risk — not acceptable for container-load deals where losing a number mid-cycle could kill a $100K order. Rejected.

**Path C: Keep everything on mobile-only WAB with no API layer**
Preserves the KAM experience but cannot support outbound scale, routing, or owned-data requirements. Too small for the target volume. Rejected.

---

## 8. AI Use vs. Override

The first AI-generated answer pushed toward the standard consolidate-to-one-number/shared-inbox model. That was rejected immediately because it violated the brief's hard constraint — KAMs must keep WAB on their phones — and because more recent Coexistence docs make the old "API and app cannot coexist on the same number" assumption outdated.

The final recommendation was anchored on current documentation: 360dialog Coexistence, message echoes, and Embedded Signup. The main override was to stop treating pricing as a vague range and instead pin it to the actual documented tiers (Regular, Premium, Higher Throughput) as listed on 360dialog's pricing page.
