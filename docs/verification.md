# Verification

14 November 2026: npm install, npm test, npm run demo, npm run view and npm run docs passed locally on Linux with Node 22. The suite covers 84 assertions and all 27 CLI commands. Thirty-one slash recipes include the CLI jobs, documents, views, customisation and adding a view.

The tests exercise import preview, duplicate batches, source revisions, whole-file validation, case-insensitive and ambiguous matching, capped activity points, old events, suppression, missing review evidence, stale inputs, model activation, audit entries, export preservation, CLI exit status and report escaping. They isolate their data in a temporary directory. TEST_DATABASE_URL switches the suite to a unique disposable PostgreSQL schema.

The repository workflow runs Node 20 and 22 on Windows and Linux, plus PostgreSQL 16 on Linux. All five jobs passed for commit 3a30edb: https://github.com/Enterprise-DNA-OS/lead-qualification-for-claude-code/actions/runs/43647738273.

The demo contains five seeded fictional contacts and one additional synthetic import. The branded review and decision record were inspected in a headless browser. The review was narrowed to six columns so it fits a desktop page. Its actual prioritise, compliance and stale-signals outputs were captured for the comparison page. No customer records or fabricated terminal output were used.
