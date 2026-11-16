# VPAF source notes (v0.1 draft)

Status: DRAFT for Mittu's review. Nothing here is final until each of the 54 stage tests is approved.

Purpose: the single source for the Venture Progression Assessment Framework (VPAF). `vpaf.v1.json` and `questions.v1.json` are generated from this file and from nothing else.

Basis: Merstra's diagnostic practice — the assessment-call question guide, the scoring rulings made during the IPTIF EIR 2026 cohort (benchmark, midline, endline), and the evidence founders actually submitted. Rulings taken from that cohort are marked **[Ruling]**. Items I proposed and Merstra has not yet decided are marked **[PROPOSED]**.

Stage numbers keep the same meaning as the scores already issued to past cohorts, so historic scores carry over 1:1.

---

## 1. Shape

- 6 dimensions: Customer (CUS), Product (PRD), Business Model (BIZ), Moat (MOT), Team (TEA), Capital (CAP).
- 9 stages per dimension, shown as "Stage 1" to "Stage 9". No stage names.
- 3 bands: Explore (1-3), Validate (4-6), Scale (7-9).
- Each stage is a pass/fail test about something observable. A stage is passed only when the test is true AND proof exists.

## 2. How to score

1. Per dimension, award the highest stage whose test is passed with proof.
2. If the proof for that stage is weak, award one stage lower.
3. Where two stages are arguable, award the lower one.
4. A claim with no proof is not counted.
5. Unfilled, placeholder or template text is treated as unanswered. **[Ruling]**
6. If two answers contradict each other, the contradicted claim is not counted. **[Ruling]**
7. A missing upload lowers confidence in that dimension; it does not by itself cancel the founder's written answer. **[Ruling]**
8. Numbers with no source are not counted. **[Ruling]**
9. Stages cannot be skipped: every stage below the awarded one must also be true.

## 3. Checkpoint rules (Benchmark, Midline, Endline)

- Anchor: before re-scoring, restate the previous checkpoint's stage and the proof behind it.
- Ratchet: a stage drops only on explicit proof of loss, pivot, or admitted earlier over-scoring.
- Silence: a dimension not addressed stays at its anchor stage.
- Low confidence: the result equals the anchor stage.
- Earlier proof still stands unless shown to be lost. A founder describing the venture more modestly than before is not proof of loss. **[Ruling]**
- A failed test or lost trial does not lower a stage already earned; it is recorded as a risk. **[Ruling]**
- New entrants with no Benchmark are scored from their submission alone, lower-stage default. **[Ruling]**
- Reported change is Benchmark to Endline only.

## 4. Confidence

- HIGH: strong proof attached for the awarded stage.
- MEDIUM: proof attached but weak, indirect, or partly missing.
- LOW: written answer only, or proof contradicted elsewhere.

## 5. Count tiers for founder answer options [PROPOSED]

Founders choose a described tier, never type a number.

| Tier | Meaning |
|------|---------|
| None | 0 |
| A few | 1-4 |
| Several | 5-14 |
| Many | 15 or more |

Thresholds are a starting proposal; Merstra to confirm per question.

## 6. Proof catalogue

| Proof type | Strong when | Weak when |
|------------|-------------|-----------|
| Conversation / interview notes | Dated, names the person or organisation, records what they said | Undated, anonymous, or only the founder's summary |
| Interview log | Count, segment, and the repeated pattern are shown | A list of names with no content |
| User test record | Who tested, what version, what happened, what changed after | "Users liked it" |
| Letter of intent / MoU | Signed, dated, names both parties and the scope | Unsigned draft, email expressing interest |
| Pilot plan | Agreed with the customer, with success measures | Internal plan the customer has not seen |
| Invoice / payment record | Issued to a named customer, payment visible | Quotation or proforma only |
| Pipeline list | Named prospects with status and next step | Target list with no contact made |
| Design document / schematic | Specific enough to build from | Concept sketch |
| Demo, photo, video | Shows the actual build working | Render or mock-up |
| Test report | Method, measured values, pass/fail against a target | Statement that tests were done |
| Field or site trial log | Location, dates, conditions, results | Planned trial |
| Cost and price sheet | Uses real purchase or delivery figures | Estimates only |
| Go-to-market plan | Named channels, steps and owners | Generic list of channels |
| Uniqueness / invention note | States what is new and who created it | Marketing description |
| Ownership or assignment agreement | Signed by all contributors and any institution | Verbal understanding |
| Filing or registration receipt | Official number and date | "Filing planned" |
| Role map / organisation chart | Named people, time commitment, responsibilities | Titles only |
| Weekly tracker | Several consecutive weeks of goals and reviews | A blank template |
| Adviser list | Named, independent of the founders, with evidence of activity | Names only, or relatives of founders **[Ruling]** |
| Budget / runway sheet | Monthly spend, cash in hand, months remaining | A single total |
| Pitch deck | Complete: problem, solution, market, traction, team, ask | Partial or template slides |
| Funder correspondence | Dated exchange with a named funder | List of funders to approach |
| Commitment letter / term sheet | Signed or issued by the funder, to this entity | Verbal promise, or commitment to a different entity **[Ruling]** |
| Bank or grant record | Shows funds received | Award announced but not received |

---

## 7. Stage tests by dimension

### 7.1 Customer (CUS)

What it tracks: how far the venture has gone from believing there is a customer to winning and keeping customers repeatedly.

| Stage | Test — true when | Proof that passes it |
|-------|------------------|----------------------|
| 1 | The customer and the problem are the founders' own belief; nobody outside the team has been asked. | None needed. |
| 2 | Some potential customers have been spoken to, but what they said does not yet point one way. | Conversation notes. |
| 3 | The team can name one specific customer group and state its problem in a sentence; interest so far is verbal. | Written segment and problem statement; conversation notes. |
| 4 | Interviews with that group keep confirming the same problem, and a written offer to them exists. | Interview log showing the pattern; written offer. |
| 5 | People from the target group have tried the concept or prototype, and their feedback has changed something. | User test records; record of changes made. |
| 6 | A named customer has agreed in writing to a pilot or to buy, and both sides have agreed how success is measured. | Signed LoI / MoU; agreed pilot plan. |
| 7 | A customer has paid or a committed pilot is running, and the same route to a sale has worked more than once. | Invoices or payment records; pilot agreement. |
| 8 | Several customers are paying, upcoming sales can be forecast, and each new customer is onboarded the same way. | Customer list; pipeline with status; onboarding checklist. |
| 9 | New customers arrive without the founders selling each deal, existing customers stay and buy more, and customers act as references. | Retention and repeat-purchase data; reference customers. |

Rulings and notes
- A signed LoI or MoU passes Stage 6 even if the trial has not started. **[Ruling]**
- Interest from friends, family or the host institution is not customer proof.
- A claim of an "externally validated pilot" needs the external party's document, not the founder's description. **[Ruling]**

### 7.2 Product (PRD)

What it tracks: how far the product or technology has gone from an idea to something that runs reliably at commercial volume.

| Stage | Test — true when | Proof that passes it |
|-------|------------------|----------------------|
| 1 | The product is described but nothing has been built. | None needed. |
| 2 | A written plan says what will be built first and how it will be tested. | Design document or schematic. |
| 3 | A first build exists; it works inconsistently and has had little testing. | Demo, photo or video of the build. |
| 4 | The core functions work in the team's own controlled tests, with measured results. | Test report with measured values. |
| 5 | The build has been changed because of test results, and repeat tests show it failing less often. | Test logs across versions. |
| 6 | It has worked in conditions close to real use, outside the team's own bench or lab. | Field or site trial log. |
| 7 | It has worked in the customer's real setting with real users. | Deployment record; user logs. |
| 8 | It performs consistently across several users or sites. | Performance data from more than one user or site. |
| 9 | It runs at commercial volume, with support and maintenance in place. | Volume records; support and maintenance records. |

Rulings and notes
- A fabricated unit whose subsystems are bench-tested with measured data passes Stage 4. **[Ruling]**
- If earlier build proof exists, a founder calling the product a "concept" at a later checkpoint does not lower the stage. **[Ruling]**
- Failed batches or a lost field trial do not lower an earned stage; record them as risks. **[Ruling]**
- The measure that matters differs by venture (accuracy, strength, uptime, cost). The founder names it; the test report must report it.

### 7.3 Business Model (BIZ)

What it tracks: how far the venture has gone from not knowing who pays to a model that keeps working as it grows.

| Stage | Test — true when | Proof that passes it |
|-------|------------------|----------------------|
| 1 | The team cannot say who pays or why. | None needed. |
| 2 | Who pays, for what, and how the money is collected is written down. | Written model. |
| 3 | Cost and price figures are written down, but they are the team's own estimates. | Cost and price sheet (estimates). |
| 4 | The price and model have been put to customers and adjusted from their response. | Notes or survey showing price discussed with buyers; revised model. |
| 5 | Cost per unit and margin are calculated from real purchase or delivery figures, and the routes to market are chosen. | Cost and price sheet with real figures; go-to-market plan. |
| 6 | Customers have paid or committed at the stated price in a pilot or test sale, and a delivery plan is written. | Invoices or signed commitments at that price; delivery plan. |
| 7 | The same route to market has produced sales repeatedly, and at least one channel or partner is delivering. | Sales records by channel; partner agreement. |
| 8 | Margin and delivery stay steady as volume rises, and a written plan for growth exists. | Margin trend; delivery records; growth plan. |
| 9 | The model sustains growth and its key figures are reviewed on a fixed schedule. | Regular metrics reviews over time. |

Rulings and notes
- However detailed the cost model, a price never put to a customer holds the venture at Stage 3. **[Ruling]**
- A survey of buyers that changes the model (for example sale to rental) passes Stage 4. **[Ruling]**
- "NA" or blank unit economics are treated as unanswered.

### 7.4 Moat (MOT)

What it tracks: what the venture has that others cannot easily copy, and how well it is owned and protected. Covers patents, designs, trademarks, trade secrets, proprietary data, know-how, licences and regulatory approvals, and exclusive agreements.

| Stage | Test — true when | Proof that passes it |
|-------|------------------|----------------------|
| 1 | The team cannot say what is hard to copy, or who owns what has been created. | None needed. |
| 2 | The team has started checking what already exists: similar products, published work, existing rights. | Search notes. |
| 3 | What is unique is written down, and ownership is settled between founders, institution and other contributors. | Uniqueness note; ownership or assignment agreements. |
| 4 | For each asset, a route of protection has been chosen (register it, keep it secret, lock it in by contract) with reasons. | Written protection plan. |
| 5 | Protection is being prepared with professional help, and records are kept in a standard way. | Draft applications; engagement with an attorney; record-keeping in use. |
| 6 | First formal protection is in place, and the risk of infringing others' rights has been reviewed. | Filing or registration receipt; review note; signed confidentiality agreements. |
| 7 | Protection has been extended to the markets and assets that matter commercially, and is tied to the business plan. | Further filings or registrations; plan linking them to revenue. |
| 8 | The position has held up, and licensing or partnership options built on it have been explored. | Grants or registrations issued; licensing or partnership discussions. |
| 9 | The position is maintained and monitored, and it visibly earns business value. | Renewal and monitoring records; licence income, exclusivity or pricing advantage. |

Rulings and notes
- A filing or registration claimed in one answer and denied in another is not counted. **[Ruling]**
- University or employer involvement must be resolved in writing before Stage 3 is passed.
- OPEN: in the 2026 cohort a filed patent was held at Stage 5 "for consistency with peers", though a filing receipt meets the Stage 6 test. Decide: does Stage 6 require the infringement-risk review as well as the filing? As written here, it does.
- OPEN: for ventures with no registrable asset (services, food, retail), confirm that trade secrets, brand registration and exclusive contracts can carry them through Stages 4-9.

### 7.5 Team (TEA)

What it tracks: how far the venture has gone from one person to an organisation that runs without depending on its founders for every task.

| Stage | Test — true when | Proof that passes it |
|-------|------------------|----------------------|
| 1 | One founder, with key skills missing. | None needed. |
| 2 | Talks are under way with possible co-founders or first team members; roles are not agreed. | Notes or correspondence. |
| 3 | A core team is in place; roles are partly agreed and time commitment is uneven. | Role map with time commitment. |
| 4 | Every role is written and owned, the team works to a regular rhythm, and the gaps that need advisers are named. | Role map; weekly tracker; list of gaps. |
| 5 | Independent advisers are active, and there is a written hiring plan for the most pressing gap. | Adviser list with activity; hiring plan. |
| 6 | The team has kept to its rhythm over time, and decision rights and founder agreements are in place. | Tracker history; founder agreement; decision records. |
| 7 | All critical functions are covered by capable people, delivery is predictable, and there is structure beyond the founders. | Organisation chart; delivery record against plan. |
| 8 | Hiring, onboarding and performance review run as systems, without founders handling each case. | Documented processes in use. |
| 9 | A leadership team runs the company, and governance and culture hold as headcount grows. | Board or governance records; leadership structure. |

Rulings and notes
- Two full-time founders with a written, evidenced working rhythm pass Stage 3. **[Ruling]**
- An adviser related to the founders does not count as independent for Stage 5. **[Ruling]**
- A hire for the most pressing gap that is many months away does not pass Stage 5. **[Ruling]**
- Headcount uses the conservative, named count; implausible hours are not counted. **[Ruling]**
- A stated dependency on one founder contradicts a claim of resilience; the contradicted claim is dropped. **[Ruling]**

### 7.6 Capital (CAP)

What it tracks: how far the venture has gone from no view of its money to being able to choose between sources of capital.

| Stage | Test — true when | Proof that passes it |
|-------|------------------|----------------------|
| 1 | No view of how much money is needed or how long cash will last. | None needed. |
| 2 | The team knows roughly what it needs and has a rough budget. | Budget / runway sheet. |
| 3 | A complete pitch and milestones exist, but the route to money is not decided. | Pitch deck; milestone list. |
| 4 | The pitch is backed by supporting data, and there is a plan naming whom to approach. | Deck with data pack; outreach plan. |
| 5 | Conversations with funders are live, and each milestone is tied to an amount. | Funder correspondence; milestone-to-capital map. |
| 6 | The venture could take money now: use of funds is clear and the documents a funder would ask for are ready. | Use-of-funds statement; document set. |
| 7 | Written commitments are in progress, and the runway is planned against them. | Commitment letters or term sheet; runway plan. |
| 8 | Money is in the bank or revenue reliably covers costs, with financial controls working. | Bank or grant record; management accounts. |
| 9 | The venture can choose between several sources of capital, with reliable forecasting and governance. | Multiple offers or facilities; forecasts against actuals. |

Rulings and notes
- A complete investor deck passes Stage 3. **[Ruling]**
- What matters at Stage 2 is that a runway has been worked out; arithmetic errors in it are not critical. **[Ruling]**
- A commitment that is unevidenced, not yet legally formed, or made to a different entity is not counted. **[Ruling]**
- Grants count the same as investment at every stage.
- Founding date is not a scoring factor. **[Ruling]**

---

## 8. Decisions needed before v1.0

1. Approve or edit each of the 54 stage tests.
2. Confirm the count tiers in section 5.
3. Resolve the two OPEN items under Moat.
4. Confirm that stage numbers keep 1:1 meaning with scores issued to past cohorts.
5. Independent IP review of this text before public release.
