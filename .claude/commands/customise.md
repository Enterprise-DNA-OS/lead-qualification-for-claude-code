# customise

Read CLAUDE.md and the existing migration. Back up the authorised database first. For a field, write a new numbered migration, update the CLI allowlist and validation, add a meaningful test and update reports and documentation. For weights, use model-add and model-activate so prior policies remain intact. Run npm test on a temporary database, then npm run migrate against the authorised database and demonstrate the changed record. Never seed a working database. Never add sending or automatic deletion.
