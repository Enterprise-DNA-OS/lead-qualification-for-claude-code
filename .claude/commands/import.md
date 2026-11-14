---
description: "Read docs/replace-madkudu.md."
---

# import

Read docs/replace-madkudu.md. Map the actual export headers. Dry-run first, reconcile counts, then repeat without --dry-run. Preserve source files privately.

```bash
npm run qualify -- import madkudu --file="<CSV>" --source="<source label>" --exported-at="<ISO timestamp>" --actor="<operator>" --dry-run
```

Use --json when needed. Present the result and its missing evidence. Stop if a name is ambiguous; show the candidates.
