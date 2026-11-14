# Operations

Use Node 20 or newer. npm ci installs the locked dependencies. npm run migrate applies numbered migrations. The same PostgreSQL SQL runs in PGlite. DATABASE_URL selects a PostgreSQL database and its owner connection; no public role receives access. PGlite is for one operator/process at a time. Do not open the same local directory in concurrent processes.

All generated business files belong in ignored imports, exports, drafts, .data, docs-out or views directories. They contain personal information. Raw imports and saved score inputs retain it too. Do not commit them. Restrict filesystem and database access to trusted operators. Hosted authentication, tenant separation and operational monitoring need deployment-specific work.

Use export --file=exports/new-name.json to preserve every domain record and source batch in JSON. Existing files are never overwritten. This archive is portable evidence, not an automatic restore command. For PGlite, stop every process and copy the entire DATA_DIR; restore that copy into a new directory and verify counts, detail and prioritise. For PostgreSQL use pg_dump and restore into an isolated database, then verify those same records. Regularly rehearse recovery. Retention/erasure must include copies, imports, historical snapshots and backups under an authorised process.

All CLI mutations use a transaction and record an operator label in audit_log. Policy activation serialises through model rows. Policies and historical scores are not edited through the CLI. Database owner access can alter history and is not tamper-proof. Do not treat actor labels as verified signatures.

Model configuration has explicit weights and thresholds. The engagement window counts each unique source event once, caps total engagement at 100 and excludes future or old observations. It does not deduplicate two different keys describing the same event, or infer bot traffic. Validate event sources and keys before loading them. Outcomes show current recorded labels by latest segment; they do not provide causal attribution or predictive validation.
