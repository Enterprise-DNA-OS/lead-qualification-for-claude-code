---
description: "Review the latest export date per source."
---

# source-freshness

Review the latest export date per source. Seven days is a demo operating rule. An empty result means no export has been loaded.

```bash
npm run qualify -- source-freshness
```

Use --json when needed. Present the result and its missing evidence. Stop if a name is ambiguous; show the candidates.
