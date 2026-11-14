# Lead Qualification for Claude Code

Own the rules that decide which enquiry deserves attention. Keep contact facts, observed activity, imported MadKudu scores and your own qualification decisions together.

## Three ways to use it

- **Do it yourself:** free MIT source. Run locally with Claude Code, Codex, OpenCode or Cursor.
- **We customise it:** Enterprise DNA maps your MadKudu history, adds your qualification rules and connects your systems. One setup fee, then a retainer.
- **We run it for you:** installed, connected and operated through **Omni by Enterprise DNA**. One setup fee, then a retainer. [Talk to Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=madkudu&utm_medium=readme).

## Start with synthetic records

Node 20 or newer. PGlite runs locally without a server; DATABASE_URL selects PostgreSQL.

```bash
npm install
npm run demo
npm run qualify -- prioritise
npm run qualify -- attention
npm run qualify -- explain --contact=rae@harbour.example
npm run qualify -- weekly-review --json
npm run view
npm run docs
npm test
```

The demo seeds five fictional contacts and imports one more synthetic enquiry, including an old trial, missing purpose evidence, an expired retention review and a suppressed enquiry. Use an empty database. Repeated seeding makes no changes. This is an operator-run qualification desk with explicit rules, not a trained predictive model or a proprietary contact database.

## The week

Use /prioritise for the daily handover, /stale-signals for activity that has aged out, /score-changes after a policy review, /compliance for missing evidence and /weekly-review for the Monday meeting. /log records a review; /draft-handover writes locally and never sends.

Fit points come from industry, country and employee range. Engagement points come from documented events inside the policy's lookback window. Each component is capped at 100, then combined using fit_weight. The demo threshold is 60, its activity window is 30 days and accuracy review is 90 days. These are editable operating policies, not legal deadlines or calibrated conversion probabilities. Won, lost, disqualified and suppressed contacts stay out of the handover. Missing purpose, ownership, accuracy or retention evidence also puts a contact on hold.

Each score saves its policy, contact inputs, events and reasons. Old scores remain inspectable. A changed contact, newly recorded event, different active model or score older than one day requires re-scoring before handover. Imported vendor scores are historical reference points on a different scale.

## Bring your records across

```bash
npm run qualify -- import madkudu --file=fixtures/madkudu.csv --source=synthetic-salesforce --exported-at=2026-11-13T00:00:00Z --actor="Demo operator" --dry-run
```

Repeat without --dry-run after reviewing the output. The fixture is synthetic and follows documented CRM field names; it is not a downloaded customer export. The importer supports contact score exports, preserves all source columns and never overwrites locally reviewed contact fields. Bulk Scorer exports need their actual headers checked and mapped. Account-only domain lists, trained models and licensed enrichment do not transfer. [Switch guide](docs/replace-madkudu.md).

## Ten questions the desk answers

1. Which high-scoring enquiries still lack a recorded purpose? compliance
2. Which contacts are eligible for today's handover? prioritise
3. Why did this contact receive these points? explain
4. Which old trial signals have stopped contributing? stale-signals
5. Which local scores changed after the last review? score-changes
6. Which sources have not been refreshed? source-freshness
7. Which imported vendor scores preceded our own decision? detail
8. Which saved scores became stale when records changed? attention
9. How do recorded outcomes differ by latest segment? outcomes
10. Who activated the policy and what reason did they record? audit

These questions work today. They combine your local evidence with imported history; they are not an unsupported claim that MadKudu cannot report similar facts.

## Commands

- /help: Read the command list.
- /contacts: Review the contact register and ownership.
- /detail: Read the record, source history, notes and observations before changing it.
- /models: Read every policy version and which one is active.
- /scores: Read historical scores. These are snapshots; use prioritise for current eligibility.
- /explain: Explain the fit points, activity window and holds from the saved inputs.
- /prioritise: Prepare the daily qualification queue. Only current, eligible priority records appear. A score is not permission to contact.
- /attention: Review missing evidence, ownership, retention, stale scores and changed inputs.
- /stale-signals: Review activity outside the active policy window. Do not invent replacement observations.
- /score-changes: Compare the last two local decisions. Highlight model changes before interpreting a delta.
- /source-freshness: Review the latest export date per source. Seven days is a demo operating rule. An empty result means no export has been loaded.
- /outcomes: Review recorded open, won, lost and disqualified outcomes by latest segment. Counts are descriptive, not proof that scoring caused a sale.
- /compliance: Check purpose evidence, accuracy and retention reviews, suppression and ownership. Read docs/compliance.md. Never call this legal certification.
- /imports: Reconcile loaded batches against the source counts.
- /audit: Read operator-labelled changes and their reasons. Actor labels are not authenticated identities.
- /weekly-review: Run prioritise, attention and compliance, then source-freshness and outcomes. Explain owners, decisions and missing evidence in one Monday review.
- /add: Register an authorised enquiry. Missing review evidence keeps it on hold.
- /update-contact: Read detail first. Record corrections, ownership, lawful purpose evidence and review dates supplied by the operator. Then re-score. Never infer evidence from a high vendor score.
- /event: Record an observed event with a unique source key. Kinds: demo_requested, trial_started, pricing_viewed, active_day, meeting_held. Then re-score.
- /log: Add the actual review note after reading detail.
- /suppress: Record an opt-out or local hold immediately. It excludes the contact from handovers without waiting for another score.
- /model-add: Copy fixtures/policy.json into a private policy file and edit the documented fields. Create a new named version. No trained vendor model transfers.
- /model-activate: Read the proposed policy and explain changed weights and thresholds. Activate the authorised version, then score all contacts. Activation invalidates old handovers.
- /score: Recalculate the register with the active policy, preserving inputs and explanations for every decision. Optional --contact limits the run.
- /import: Read docs/replace-madkudu.md. Map the actual export headers. Dry-run first, reconcile counts, then repeat without --dry-run. Preserve source files privately.
- /export: Write a complete private JSON archive, including raw imports and history. Never overwrite an existing archive or put it in a public repo.
- /draft-handover: Re-score first and review prioritise. Write an internal handover in drafts. Never send, enrol contacts in sequences or infer contact permission.

Every CLI command supports --json. All writes require --actor, a supplied label rather than an authenticated identity. Partial IDs and case-insensitive names work; ambiguous matches list candidates and exit 1. The recipes contain the required flags. Use /customise and /new-view for tested changes.

## Documents in your brand

Edit brand.json. npm run docs renders qualification decision records and model review papers. npm run view renders historical score summaries, current attention, recorded outcomes and source freshness. Outputs are read-only HTML with no server or user interface to maintain. [Why no front end](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our business name on the decision record.
2. Show today's eligible enquiries.
3. Explain why the old trial contributes no points.
4. Show the missing purpose evidence.
5. Preview our exported contact scores.
6. Compare imported history with our latest assessment.
7. Record an observed demo request.
8. Draft the internal handover.
9. Create a new version of our scoring policy.
10. Add our product line using /customise.

## Scope and operation

This desk operates on authorised first-party records supplied by an operator. It does not discover contacts, buy enrichment, identify anonymous visitors, sync a CRM, train statistical models or send messages. Enterprise DNA can scope connections and screens for your version. Keep the vendor service if you need its proprietary data or predictive models unchanged. [Operations](docs/operations.md), [compliance checks](docs/compliance.md), [research](docs/research.md).

MIT. Not affiliated with MadKudu, HG Insights or Anthropic. Agent subscriptions, hosting and operation remain your costs.
