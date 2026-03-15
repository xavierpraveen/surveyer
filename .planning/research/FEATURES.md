# Feature Research

**Domain:** Internal organizational health / employee survey platform
**Researched:** 2026-03-15
**Confidence:** MEDIUM — Based on training knowledge of Culture Amp, Lattice, Leapsome, Glint, Officevibe/Workleap, SurveyMonkey Engage through August 2025. Web access unavailable for live competitor verification; patterns are well-established and stable in this domain.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that employees, managers, and leadership assume exist. Missing these makes the platform feel broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Anonymous response mode | Employees won't be honest unless anonymity is credible; every major platform offers it | HIGH | Must be enforced at the data layer (RLS), not just UI. "We promise it's anonymous" is not sufficient. |
| Privacy threshold — suppress small-group aggregates | Standard across all platforms; absence creates real deanonymization risk and destroys trust | LOW | Industry standard is 5 respondents minimum before showing aggregate. Culture Amp default is 5, Glint uses 5, Officevibe uses 3. This project uses 5. |
| Participation rate tracking per department/team | Managers and HR need to nudge non-respondents without identifying who hasn't responded | MEDIUM | Must be decoupled from identity — show "7 of 12 in Engineering responded", never show who. |
| Likert scale questions (1–5 or 1–7) | Universal standard for attitude measurement; all platforms use it | LOW | 1–5 is easier for employees. 1–10 is more granular but increases cognitive load. Both should be supported. |
| Multiple question types | Surveys need variety — text, scale, single/multi-select | LOW | Likert, single-select, multi-select, short text, long text are the standard set. |
| Survey lifecycle states (draft → scheduled → open → closed) | Admins need to prepare surveys in advance and control timing | MEDIUM | All platforms have this; employees should not see a survey until it is "open". |
| Score aggregation per dimension/category | Raw responses are useless; the platform must produce dimension scores | HIGH | Favorable/neutral/unfavorable bucketing (e.g., ≥4 = favorable on 1–5 scale) is standard alongside mean score. |
| Trend analysis across survey cycles | Single-point data is low value; pattern over time is what drives action | HIGH | Requires consistent question IDs / dimension mapping across cycles. Delta vs prior cycle is the most-read number. |
| Role-based access control | Employees, managers, HR, leadership, and admins have different data needs and sensitivities | HIGH | Manager access must be privacy-gated for small teams. This is a non-negotiable safety mechanism. |
| Email/notification reminders for survey completion | Participation rate is the #1 operational concern; reminders are mandatory | MEDIUM | Platforms send 2–3 reminders. Must not accidentally reveal who has or hasn't responded. |
| Admin survey builder | Someone must be able to create and configure surveys without a developer | HIGH | Drag-and-drop is nice-to-have; ordered sections with question types is the minimum. |
| Mobile-responsive design | Employees access surveys on phones, especially when reminder emails arrive | MEDIUM | Not a native app, but responsive web is expected. |
| Export results (CSV/PDF) | HR and leadership need data for board decks, offsites, external consultants | MEDIUM | CSV for raw data analysis, PDF for presentable snapshots. |
| eNPS question support | "How likely are you to recommend this company?" is the most-compared org health metric | LOW | Single question, 0–10 scale, buckets into Detractors/Passives/Promoters. Universally expected. |
| Survey completion confirmation | Employees need to know their response was submitted | LOW | Simple "thank you" page with timestamp. Prevents double-submission attempts. |

---

### Differentiators (Competitive Advantage)

Features that go beyond the expected baseline. For a custom internal tool at an ~87-person consulting firm, these are where institutional credibility is built.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Transparent internal results publishing | Employees see the same data leadership sees (appropriately aggregated); destroys "management keeps results secret" cynicism | HIGH | This is the project's core value. Culture Amp and Lattice have no equivalent — results stay with HR. Glint has manager sharing but not employee-visible transparency pages. |
| Action items publicly linked to survey results | Closes the loop: employees see "leadership committed to X because of Y score" — destroys survey fatigue | HIGH | Most platforms have action tracking for managers/HR only. Making these visible to all employees is rare and high-trust. |
| Immutable publication snapshots | Employees trust that results won't be quietly revised after the fact | MEDIUM | Culture Amp and others do not publish immutable snapshots; this is a custom trust mechanism. |
| Role-targeted question sections | Engineering gets different questions than Sales; reduces survey fatigue and increases signal quality | MEDIUM | Lattice and Culture Amp support audiences/segments; the differentiation here is tight department-specific diagnostic questions vs generic questions for all. |
| 12-dimension organizational diagnostic model | A structured model (not just "culture" or "engagement") gives actionable specificity — "Architecture & Technical Governance scored 2.8, here's why" | HIGH | Generic eNPS + free-text is what SurveyMonkey gives you. A dimensional model is what org design consultants use professionally. |
| Manager chain segmentation in analytics | See results sliced by manager, not just department — surfaces "engineering is fine but one team is struggling" | HIGH | Requires manager hierarchy data. Culture Amp and Glint have this; Officevibe does not. Very high value at 87 people. |
| Tenure band segmentation | "People who joined in the last 6 months score onboarding 2.1" is a distinct signal from overall score | MEDIUM | Lattice and Culture Amp have this; most smaller tools don't. Valuable for a consulting firm with variable tenure patterns. |
| Pluggable AI summarization of open-text responses | Qualitative themes surfaced automatically without an analyst reading 500 text responses | HIGH | Culture Amp has built-in AI text analysis. The differentiator here is a provider-agnostic interface so the company is not locked into one vendor. |
| Participation token pattern (separation of identity from response) | Technically enforces anonymity — not just a policy promise but a cryptographic/structural guarantee | HIGH | Almost no vendor explains or guarantees this at the DB-schema level. This matters for a technically literate workforce who will ask how it works. |
| Action progress log (OKR-style updates) | Each action item has a timestamped log of progress notes — employees can see movement over weeks/months | MEDIUM | Lattice has OKR tracking but it's separate from survey results. The integration with survey dimensions is rare. |
| Confidence indicators on small samples | When a team of 6 has a 3-person response, the score is flagged as low-confidence rather than hidden entirely | LOW | Most platforms just suppress below threshold. Showing "score available but low confidence (n=3)" is more honest. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Individual response attribution (admin sees who said what) | "We need to follow up with people who flagged issues" | Destroys anonymity trust permanently; once employees know admins can see who said what, honesty collapses | Action items and follow-up discussions happen at team/dimension level, not individual level |
| Continuous always-on pulse surveys | "We want real-time feedback, not one survey a year" | Employees experience survey fatigue within 4–6 weeks; response rates crater below statistical utility; Officevibe built its product on this and most enterprise customers disable it | Quarterly cadence with clear action cycle between surveys |
| Manager-initiated ad hoc surveys | "Managers want to send their own team surveys" | Creates fragmented data that can't be compared org-wide; managers use surveys as performance proxies; small team surveys deanonymize | Centrally administered surveys with manager-visible filters; managers request topics to include in next org survey |
| Per-response IP or device fingerprinting | "We need to prevent ballot stuffing" | One-person-one-response is already enforced by auth; fingerprinting data is deanonymization metadata | Auth-bound response tokens (one submission per authenticated user per survey) |
| Real-time live response dashboards | "Leadership wants to watch results come in" | Creates pressure to close surveys early when numbers look bad; creates anxiety about early movers being identifiable | Results visible only after survey closes and minimum threshold is met |
| Public-facing (external) results page | "Transparency is good, why not show candidates too?" | Mixes internal organizational candor with employer branding; employees will self-censor if answers appear on a public page | Internal-only transparency page; separate employer brand content controlled by marketing |
| "Suggest a question" from employees | "Employees should drive the survey content" | Introduces unstructured noise; hard to maintain dimensional consistency; some suggestions reveal grievances better surfaced via 1:1s | A feedback/suggestion channel separate from the survey instrument; HR reviews suggestions for next cycle |
| Benchmarking against external industry databases | "How do we compare to other tech consulting firms?" | Benchmark data is unreliable, often outdated, and creates goal confusion (aim for benchmark vs aim for improvement) | Trend improvement vs own prior cycles is a stronger signal; internal targets per dimension |
| Forced re-survey after low scores | "If a dimension scores below X, automatically trigger a follow-up survey" | Punishes managers for low scores by adding survey burden; damages trust | Triggered action item workflow, not another survey |

---

## Feature Dependencies

```
Anonymous Response Mode
    └──requires──> Participation Token Pattern (decoupled identity from response)
                       └──requires──> RLS policies that prevent identity-response joins
                                          └──requires──> Separate participation_tokens table

Score Aggregation per Dimension
    └──requires──> Question-to-Dimension Mapping
                       └──requires──> Dimension Model Definition
    └──requires──> Privacy Threshold Enforcement (suppress if n < 5)

Trend Analysis
    └──requires──> Multiple Survey Cycles with consistent Question IDs
    └──requires──> Score Aggregation (per cycle)
    └──requires──> Survey Versioning (to track question consistency across cycles)

Transparent Results Publishing
    └──requires──> Publication Snapshot (immutable point-in-time record)
                       └──requires──> Score Aggregation
                       └──requires──> Privacy Threshold Enforcement
    └──requires──> Role-based Access Control (public view shows only aggregates)

Action Tracking
    └──requires──> Survey Cycle and Dimension model (actions link to dimensions)
    └──enhances──> Transparent Results Publishing (actions visible on same page as results)

Manager Dashboard
    └──requires──> Manager Chain / Org Hierarchy data
    └──requires──> Privacy Threshold Enforcement (hide if team n < 5)
    └──requires──> Role-based Access Control

AI Text Summarization
    └──requires──> Open-text Response Collection
    └──requires──> Pluggable Provider Interface (no direct LLM dependency in v1)
    └──enhances──> Leadership Dashboard (surfaces themes without manual review)

eNPS
    └──requires──> Score Aggregation (bucket logic: Detractors 0–6, Passives 7–8, Promoters 9–10)
    └──enhances──> Leadership Dashboard (standard external comparison metric)

Participation Rate Tracking
    └──requires──> Participation Token Pattern (know who responded without knowing what they said)
    └──conflicts──> Individual Response Attribution (knowing rate does not mean knowing identity)
```

### Dependency Notes

- **Anonymous Response requires Participation Token Pattern:** The only safe way to track "did this person respond?" without linking to response content is a separate token table. This is the foundational privacy mechanism everything else depends on.
- **Trend Analysis requires Survey Versioning:** If question IDs change between cycles, delta calculations break. Questions must carry stable IDs even when text is updated.
- **Transparent Results Publishing requires Immutable Snapshots:** If the results page reads live data, a retroactive data correction changes what employees already saw — destroying institutional trust. Snapshots must be written at publication time and treated as append-only.
- **Manager Dashboard conflicts with Individual Response Attribution:** These cannot coexist. A manager seeing "who said what" about their team destroys the anonymity guarantee entirely.
- **AI Summarization conflicts with Open-text Deanonymization Risk:** Sending open-text responses to an external LLM API is a privacy risk. The provider interface must include a data handling contract (e.g., no training on responses, EU data residency option).

---

## MVP Definition

### Launch With (v1)

Minimum viable for a first real survey cycle at ~87 people.

- [ ] Anonymous response mode with participation token pattern — without this, the platform has no trust foundation
- [ ] Survey builder: sections, ordered questions, Likert 1–5 / 1–10, single-select, multi-select, short text, long text — without this no survey can be created
- [ ] Survey lifecycle: draft → scheduled → open → closed — without this admins cannot safely control survey windows
- [ ] Question-to-dimension mapping + dimension model (12 dimensions) — without this analytics produce no signal
- [ ] Score aggregation: mean, favorable/neutral/unfavorable distribution per dimension — without this results are raw noise
- [ ] Privacy threshold enforcement (configurable, default n=5) — without this small teams are exposed
- [ ] Role-based access control: employee, manager, leadership, admin, hr_admin — without this wrong people see wrong data
- [ ] Participation rate by department (decoupled from identity) — HR needs this to run reminders
- [ ] Leadership dashboard: org health score, dimension scores, participation, heatmap — the primary consumer of results
- [ ] Public internal results page: company-wide dimension scores, participation rate — the core transparency value prop
- [ ] Action items: linked to survey cycle + dimension, with owner, status, priority, target date — closes the feedback loop
- [ ] Immutable publication snapshot workflow — establishes institutional credibility from cycle 1
- [ ] Email reminders for survey completion — participation rate will be low without reminders
- [ ] Role-targeted sections (per department) — reduces fatigue and increases signal quality for a consulting firm

### Add After Validation (v1.x)

Once the first survey cycle completes and the team has seen real results.

- [ ] Trend analysis / cycle delta — requires at least 2 cycles of data; not useful in v1
- [ ] Manager dashboard (team results, privacy-gated) — valuable but requires manager hierarchy data to be accurate; validate org structure first
- [ ] Tenure band segmentation — adds value once a second cohort of hires exists to compare
- [ ] eNPS question and scoring — add after validating that dimensional scores are more useful; eNPS is a secondary metric
- [ ] CSV/PDF export — leadership will ask for this after seeing the first results presentation
- [ ] Confidence indicators on low-sample scores (n < threshold but > 0) — UX refinement on top of threshold enforcement
- [ ] Open-text manual tagging and theme clustering — HR analyst workflow; not needed until volume of responses is large enough

### Future Consideration (v2+)

Defer until the platform has multiple cycles of data and demonstrated value.

- [ ] Pluggable AI text summarization — valuable at scale; overkill at 87 people with a defined question set; interface is designed in v1, implementation deferred
- [ ] Manager chain / org hierarchy analytics — requires clean and maintained org chart data; high maintenance cost to keep accurate
- [ ] Survey versioning (question evolution tracking) — needed after v1 survey is modified for a second cycle; design stable IDs from the start
- [ ] Action item progress log (OKR-style updates with timestamps) — high trust-building value but requires discipline from action owners; introduce after action tracking is established
- [ ] Conditional question visibility (show question B only if question A answer = X) — useful for diagnostic depth but adds survey builder complexity
- [ ] Multi-cycle comparison / longitudinal reporting — meaningful once 3+ cycles exist

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Anonymous response + participation token | HIGH | HIGH | P1 |
| Privacy threshold enforcement | HIGH | LOW | P1 |
| Survey builder (all question types) | HIGH | MEDIUM | P1 |
| Survey lifecycle management | HIGH | MEDIUM | P1 |
| 12-dimension model + question mapping | HIGH | MEDIUM | P1 |
| Score aggregation (mean + favorable/neutral/unfavorable) | HIGH | MEDIUM | P1 |
| RBAC (6 roles) | HIGH | HIGH | P1 |
| Public internal results page | HIGH | MEDIUM | P1 |
| Immutable publication snapshots | HIGH | MEDIUM | P1 |
| Action items linked to dimensions | HIGH | MEDIUM | P1 |
| Leadership dashboard | HIGH | HIGH | P1 |
| Participation rate by department | MEDIUM | MEDIUM | P1 |
| Email reminders | MEDIUM | MEDIUM | P1 |
| Role-targeted sections | MEDIUM | MEDIUM | P1 |
| Trend analysis / cycle delta | HIGH | HIGH | P2 |
| Manager dashboard (privacy-gated) | HIGH | HIGH | P2 |
| eNPS scoring | MEDIUM | LOW | P2 |
| Tenure band segmentation | MEDIUM | MEDIUM | P2 |
| CSV/PDF export | MEDIUM | MEDIUM | P2 |
| Confidence indicators (n below threshold) | MEDIUM | LOW | P2 |
| Open-text theme tagging | MEDIUM | HIGH | P2 |
| AI text summarization (provider interface) | MEDIUM | HIGH | P3 |
| Manager chain analytics | HIGH | HIGH | P3 |
| Conditional question visibility | LOW | HIGH | P3 |
| Action item progress log | MEDIUM | MEDIUM | P3 |
| Multi-cycle longitudinal reporting | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch — first survey cycle cannot run without it
- P2: Should have — adds significant value, add post-launch or mid-v1
- P3: Nice to have — defer until multiple cycles of data exist

---

## Competitor Feature Analysis

| Feature | Culture Amp | Lattice | Leapsome | Officevibe/Workleap | Glint (LinkedIn) | Our Approach |
|---------|-------------|---------|----------|---------------------|------------------|--------------|
| Anonymous surveys | Yes, threshold 5 | Yes | Yes | Yes, threshold 3 | Yes, threshold 5 | Yes, threshold 5 (DB-enforced, not just UI) |
| Participation token separation | Not disclosed | Not disclosed | Not disclosed | Not disclosed | Not disclosed | Explicitly designed — separate table, RLS prevents joins |
| eNPS | Yes | Yes | Yes | Yes (core metric) | Yes | Yes (v1.x) |
| Likert scale | 1–5 and 1–7 | 1–5 | 1–5 and 1–10 | 1–10 | 1–5 | 1–5 and 1–10 both supported |
| Dimension/driver model | Yes (engagement drivers) | Yes (engagement pillars) | Yes (categories) | Yes (pulse topics) | Yes (outcome areas) | Yes (12-dimension custom diagnostic model) |
| Trend over time | Yes | Yes | Yes | Yes | Yes | Yes (requires 2+ cycles; v1.x) |
| Manager dashboards | Yes (private) | Yes (private) | Yes (private) | Yes (private) | Yes (private) | Yes (private, privacy-gated; v1.x) |
| Employee-visible results page | No — results stay with HR/leadership | No | No | Partial — managers can share results with teams | No — manager sharing only | Yes — core differentiator, all employees see aggregated org results |
| Action items linked to survey results | Yes (for managers/HR) | Yes (OKR integration) | Yes | Yes (for managers) | Yes | Yes — AND visible on public employee results page |
| Immutable published snapshots | No | No | No | No | No | Yes — employees can trust results won't change retroactively |
| AI text analysis | Yes (built-in) | No | Partial | No | Yes (built-in) | Provider interface in v1, implementation deferred |
| Role-targeted questions | Yes (segments) | Yes (audiences) | Yes | Limited | Yes | Yes (8 role groups with distinct sections) |
| Tenure band segmentation | Yes | Yes | Yes | No | Yes | Yes (v1.x) |
| Survey versioning | Yes | Yes | Yes | No | Yes | Yes (stable question IDs from day 1) |
| Multi-select question type | Yes | Yes | Yes | No | Yes | Yes |
| Open-text question type | Yes | Yes | Yes | Yes | Yes | Yes |
| Conditional questions | Yes | No | Yes | No | Yes | v2+ |
| CSV/PDF export | Yes | Yes | Yes | Yes | Yes | Yes (v1.x) |
| Email reminders | Yes | Yes | Yes | Yes | Yes | Yes |
| Mobile web | Yes | Yes | Yes | Yes | Yes | Yes (responsive web) |

---

## Privacy Standards — Industry Reference

These are established patterns from the industry that directly inform implementation decisions.

**Minimum response threshold for aggregate display:**
- Culture Amp: 5 (configurable)
- Glint: 5 (configurable)
- Officevibe: 3 (configurable, criticized as too low)
- Leapsome: 5 (configurable)
- Academic consensus (survey methodology): 5 is the minimum; 10 is safer for open text
- **This project uses 5 as the default, configurable by admin. Confidence: HIGH**

**Anonymous response architecture patterns:**
- The participation token pattern (separate table for "who responded" vs "what they said") is the architecturally correct approach. No known vendor publicly documents their implementation, but the pattern is standard in privacy engineering.
- RLS-level enforcement (the DB itself cannot execute a join that reveals identity) is stronger than application-level enforcement. For a technical workforce, this is a credibility argument.
- Open-text responses carry the highest deanonymization risk at small team sizes — guarding them behind a higher threshold (e.g., n=10) than numeric scores (n=5) is a recommended practice.

**eNPS scoring formula:**
- Score = % Promoters (9–10) − % Detractors (0–6). Passives (7–8) are excluded.
- Range: −100 to +100. Tech industry typical range: +10 to +50. Tech consulting median: ~+20.
- Single question: "On a scale of 0–10, how likely are you to recommend [company] as a place to work?"

**Favorable/neutral/unfavorable bucketing on 1–5 Likert:**
- Favorable: 4–5 (agree / strongly agree)
- Neutral: 3 (neither agree nor disagree)
- Unfavorable: 1–2 (disagree / strongly disagree)
- Percentage favorable is more actionable than mean score (avoids mean masking bimodal distributions)
- Culture Amp, Glint, and Leapsome all use this bucketing. Confidence: HIGH

**Survey cadence:**
- Annual engagement survey: deep diagnostic, 30–60 questions, high completion rate, used for strategic planning
- Quarterly pulse: 5–15 questions, fast turnaround, used for directional tracking
- This project's 12-dimension diagnostic is positioned as a quarterly-to-biannual deep survey (not a weekly pulse)

---

## Sources

- Training knowledge of Culture Amp, Lattice, Leapsome, Officevibe/Workleap, Glint, SurveyMonkey Engage feature sets (through August 2025). Confidence: MEDIUM — features in this space are stable and well-documented but cannot be live-verified.
- Survey methodology standards (Likert scale design, eNPS scoring formula, favorable/neutral/unfavorable bucketing) are well-established academic and industry standards. Confidence: HIGH
- Privacy threshold of n=5 is documented in Culture Amp and Glint help documentation (training knowledge). Confidence: HIGH
- Participation token pattern is a privacy engineering standard, not specific to any vendor. Confidence: HIGH
- eNPS formula (Promoters minus Detractors) is the Fred Reichheld/Bain original formulation, widely adopted. Confidence: HIGH

---
*Feature research for: Internal organizational health / employee survey platform*
*Researched: 2026-03-15*
