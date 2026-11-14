# Replace the qualification workflow around MadKudu

HG Insights now provides the MadKudu scoring capabilities. Start with a contact export you are authorised to retain. Preserve the original privately and compare source and imported counts before changing your operating process.

## Export route

The [HG Bulk Scorer guide](https://help.hginsights.com/docs/madkudu-bulk-scorer-2) documents downloadable scored CSVs. Its output covers customer fit, not behavioural scoring. It accepts email or domain inputs; this base imports email/contact rows only. Inspect the actual output headers because the guide does not define a universal CSV schema.

Alternatively export contact or lead records from your CRM with the HG/MK fields already synced there. [Vendor field specifications](https://help.hginsights.com/docs/madkudu-field-names-and-specifications) document legacy MK and newer HG field names. Include email, vendor fit score or segment, and any contact fields you are entitled to carry over. The synthetic fixture illustrates those CRM columns, not a captured vendor file.

## One import command

```bash
npm run qualify -- import madkudu --file=imports/contacts.csv --source=crm-contact-export --exported-at=2026-11-13T12:00:00Z --actor="Operator name" --dry-run
```

Add --map=imports/columns.json when headers differ. Mapping keys: email, name, external_id, company, industry, country, employees, fit_score, engagement_score, fit_segment, engagement_segment, signals. Values name exact source columns. Example: {"email":"Contact email","fit_score":"Customer fit score"}. Review the preview, then repeat without --dry-run. Timestamps need UTC offsets and the actual export time.

The importer rejects malformed rows, duplicate emails, nonnumeric scores and missing fit values before changing anything. An identical batch is a no-op. A changed batch for the same source must carry a later export timestamp. Every revision, source column and raw file is preserved. Existing local contact fields and suppression are never overwritten; new contacts are held until an operator supplies review evidence. Missing rows never delete contacts.

## Reconcile and use

Run imports, detail, compliance and source-freshness. Compare source row counts and a sample of vendor scores. Record purpose, owner, accuracy review and retention dates from real evidence. Load observed activity with event, configure the local policy, then score. Vendor numbers remain reference history; the local rules start a separate decision history.

Trained models, licensed enrichment, account-only exports, live connections and historical activity absent from the file do not come across. A one-day switch applies to this records-and-rules workflow after you have the authorised export, not to full HG platform parity. Keep the original system available until reconciliation and your operator review are complete.
