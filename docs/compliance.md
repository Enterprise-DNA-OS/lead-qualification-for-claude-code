# Record checks and sources

Checked 14 November 2026. This is evidence checking for a trusted operator, not legal advice, a privacy certification or permission to contact someone.

| Check | What the CLI checks | Source and limit |
|---|---|---|
| NZ-IPP8 | Missing or old accuracy_checked_at puts the contact on hold | [Privacy Commissioner, Principle 8](https://www.privacy.org.nz/privacy-principles/8/): take reasonable steps to ensure personal information is fit for use. The demo 90-day interval is our policy, not a statutory period. |
| NZ-IPP9 | Missing or expired retain_until creates a review hold | [Principle 9](https://www.privacy.org.nz/privacy-principles/9/): do not retain personal information longer than its lawful purpose requires. The operator supplies the retention date; software cannot determine necessity. |
| NZ-IPP10 | Missing purpose or purpose_evidence creates a hold | [Principle 10](https://www.privacy.org.nz/privacy-principles/10/): use is limited by collection purpose, subject to exceptions. A filled field does not establish legality. |
| LOCAL-POLICY | Suppressed or closed contacts, and records without an owner, stay out of handovers | Operating controls, not a legal conclusion. |

compliance evaluates the active policy. prioritise repeats those checks at the time of use and also rejects stale scores, changed inputs and scores from another model. Re-scoring keeps the inputs and reasons for review. The attention view uses the fixed 90-day demo interval as an additional warning; use compliance for your active interval.

No automated messages or deletion run here. Before real use, the business must set its purposes, applicable jurisdictions, collection notices, access rights and retention procedure. Do not use this desk for employment, credit, insurance eligibility or other consequential decisions about people. This is sales enquiry triage only. Review retention for raw imports, score snapshots, drafts, exports and backups as well as contacts. A hold does not erase the data. A tailored, authorised erasure procedure must cover every copy.
