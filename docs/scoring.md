# Scoring engine

Code: `src/scoring/engine.ts` (pure TypeScript, no I/O). Tests: `src/scoring/engine.test.ts`. Rules come from `framework/source-notes.md` sections 2 to 4.

## How a dimension is scored

1. Collect the founder's answers for the dimension. Each answer option points at a stage; an unanswered question points at nothing.
2. Set aside any answers that contradict each other (`src/scoring/contradictions.ts`).
3. Gather proof: files and links attached at this checkpoint, plus proof carried from the previous checkpoint unless the founder marked it lost. Rejected proof is ignored.
4. Starting at the highest stage claimed, walk down to the first stage whose test is passed. A stage test is passed when every proof group listed for it in `framework/vpaf.v1.json` has at least one item attached.
5. If the proof for that stage was reviewed as weak, award one stage lower.
6. Apply the checkpoint rules: anchor, ratchet, silence, low confidence.

## Rules

| # | Rule | How it is implemented |
|---|---|---|
| 1 | Highest stage with supporting proof | Step 4 above |
| 2 | Weak proof scores one lower | A stage is weak when one of its proof groups holds only items reviewed as weak |
| 3 | A claim with no proof is not counted; a missing upload does not void a written answer for lower stages | With no proof, a real written answer can carry Stage 2 or 3 at LOW confidence. Nothing above Stage 3 counts without proof |
| 4 | Contradictory answers are not counted | Both answers are dropped and confidence becomes LOW |
| 5 | Where two stages are arguable, take the lower | A partly proven stage fails its test, so the walk continues down |
| 6 | Confidence with rationale and evidence lists | HIGH: accepted proof. MEDIUM: proof attached but unreviewed or weak. LOW: written answer only, nothing proven, or a contradiction |
| 7 | Anchor | The previous checkpoint's stage and proof are loaded first; its proof still counts |
| 8 | Ratchet | A stage drops below its anchor only with an explicit decline: loss, pivot or disclosed over-scoring, with a written explanation |
| 9 | Silence | A dimension with no answers holds at its anchor; with no anchor it is Stage 1 |
| 10 | LOW confidence equals the anchor | Applied whenever an anchor exists |
| 11 | Reported delta is Benchmark to Endline | `reportedDelta` ignores Midline |

Placeholder text ("NA", "tbd", "-", repeated characters, bracketed template text) is treated as no narrative.

A manager override never changes the system score. `applyOverride` returns both, and refuses a justification under 50 characters.

## Interpretations Merstra should confirm

These are choices the source notes leave open. Each is covered by a test, so changing one is a small edit.

| Choice made | Alternative |
|---|---|
| Unreviewed proof counts at full stage with MEDIUM confidence | Treat unreviewed proof as weak (one stage lower) until a manager accepts it |
| "Lower stages" in rule 3 means the Explore band, Stages 1 to 3 | A different cut-off |
| "Stages cannot be skipped" is enforced on the awarded stage only: its own test must be proven | Require proof for every stage below it as well, which is far stricter |
| A stage test looks at proof by type anywhere in the dimension, not only on the question that raised the claim | Tie proof to the exact question |
| Marking earlier proof as lost removes that proof but does not lower the stage by itself; lowering needs an explicit decline | Let lost proof lower the stage directly |
| The nine contradiction rules in `contradictions.ts` | Add, remove or reword rules |
| On a tie, the bottleneck is the first dimension in framework order | Another tie-break |

## How this differs from the legacy app

| Area | Legacy app | PAVE |
|---|---|---|
| Where scoring runs | Two SQL functions in the database, one of them unreachable above low stages | One TypeScript module with 30 unit tests |
| Inputs | Free numbers with thresholds (interview count, customer count, runway months) | Qualitative options only |
| Proof | Counted uploaded files, which the form no longer collected | Proof groups per stage, with all-of and any-of |
| Weak proof | Any empty text box dropped one stage | Only proof a manager reviewed as weak drops one stage |
| Unanswered | Scored Stage 1 as if answered | Recorded as not addressed; holds at anchor |
| Contradictions | Two warnings shown to the founder, no effect on score | Both answers dropped, confidence LOW |
| Confidence | A label with no explanation | Label, one-line rationale, proof used, proof missing |
| Anchor, ratchet, silence | Not implemented | Implemented and tested |
| Override | One editable row | System score and override kept as separate permanent records |

No thresholds were ported: every legacy threshold was a free number, which PAVE does not collect.
