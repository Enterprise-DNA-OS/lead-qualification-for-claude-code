---
description: "Read detail first."
---

# update-contact

Read detail first. Record corrections, ownership, lawful purpose evidence and review dates supplied by the operator. Then re-score. Never infer evidence from a high vendor score.

```bash
npm run qualify -- update-contact --contact="<email>" --owner="<owner>" --purpose="<purpose>" --purpose-evidence="<reference>" --accuracy-checked-at="<ISO timestamp>" --retain-until="<YYYY-MM-DD>" --reason="<reason>" --actor="<operator>"
```

Use --json when needed. Present the result and its missing evidence. Stop if a name is ambiguous; show the candidates.
