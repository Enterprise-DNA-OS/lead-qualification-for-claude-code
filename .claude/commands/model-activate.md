---
description: "Read the proposed policy and explain changed weights and thresholds."
---

# model-activate

Read the proposed policy and explain changed weights and thresholds. Activate the authorised version, then score all contacts. Activation invalidates old handovers.

```bash
npm run qualify -- model-activate --model="<version name>" --reason="<reason>" --actor="<operator>"
```

Use --json when needed. Present the result and its missing evidence. Stop if a name is ambiguous; show the candidates.
