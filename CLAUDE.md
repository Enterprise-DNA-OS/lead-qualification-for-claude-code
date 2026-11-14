# Lead Qualification for Claude Code

## Purpose

An operator-run qualification desk for authorised business enquiries. Set the business name in brand.json. Demo contacts and activity are fictional. Read the CLI before answering any record question.

## Rules

Use scripts/qualify.mjs for business writes. Never send, buy data, run an enrichment service or enrol anyone in a sequence. A score does not establish consent or permission to contact. Never invent purpose evidence, observed activity, accuracy reviews or retention dates. Every write records an actor label, not a verified identity. Show ambiguous candidates and stop until the operator identifies the record.

Imported source records and local scores have different meanings and scales. Never describe local weighted points as vendor predictions or probabilities. Re-score after changing inputs or models. Read docs/compliance.md before interpreting a hold.

## Routes

- /help: npm run qualify -- help
- /contacts: npm run qualify -- contacts
- /detail: npm run qualify -- detail --contact="<email or name>"
- /models: npm run qualify -- models
- /scores: npm run qualify -- scores
- /explain: npm run qualify -- explain --contact="<email or name>"
- /prioritise: npm run qualify -- prioritise
- /attention: npm run qualify -- attention
- /stale-signals: npm run qualify -- stale-signals
- /score-changes: npm run qualify -- score-changes
- /source-freshness: npm run qualify -- source-freshness
- /outcomes: npm run qualify -- outcomes
- /compliance: npm run qualify -- compliance
- /imports: npm run qualify -- imports
- /audit: npm run qualify -- audit
- /weekly-review: npm run qualify -- weekly-review
- /add: npm run qualify -- add --email="<email>" --name="<name>" --company="<business>" --actor="<operator>"
- /update-contact: npm run qualify -- update-contact --contact="<email>" --owner="<owner>" --purpose="<purpose>" --purpose-evidence="<reference>" --accuracy-checked-at="<ISO timestamp>" --retain-until="<YYYY-MM-DD>" --reason="<reason>" --actor="<operator>"
- /event: npm run qualify -- event --contact="<email>" --kind=demo_requested --at="<ISO timestamp>" --key="<source event ID>" --evidence="<reference>" --actor="<operator>"
- /log: npm run qualify -- log --contact="<email>" --body="<review note>" --actor="<operator>"
- /suppress: npm run qualify -- suppress --contact="<email>" --reason="<reason>" --actor="<operator>"
- /model-add: npm run qualify -- model-add --file="<policy file>" --name="<version name>" --actor="<operator>"
- /model-activate: npm run qualify -- model-activate --model="<version name>" --reason="<reason>" --actor="<operator>"
- /score: npm run qualify -- score --actor="<operator>"
- /import: npm run qualify -- import madkudu --file="<CSV>" --source="<source label>" --exported-at="<ISO timestamp>" --actor="<operator>" --dry-run
- /export: npm run qualify -- export --file="exports/qualification-backup.json"
- /draft-handover: npm run qualify -- draft-handover --actor="<operator>"
- /docs: npm run docs. Qualification records and policy review papers.
- /view: npm run view. Read-only review dashboard.
- /customise: tested migration and CLI change; preserve historical policies and decisions.
- /new-view: read-only query and report, verified on demo data.

## Storage

DATABASE_URL selects PostgreSQL. Otherwise DATA_DIR selects the PGlite directory, default .data/db. OUTPUT_DIR redirects reports and drafts. Never seed a working database. Read docs/operations.md for private imports, backups and restore checks. A database owner can bypass the CLI; this base is for trusted operators and is not a multi-user authorisation service.

Built and run through Omni by Enterprise DNA.
