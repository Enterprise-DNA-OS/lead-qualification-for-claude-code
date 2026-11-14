---
description: "Register an authorised enquiry."
---

# add

Register an authorised enquiry. Missing review evidence keeps it on hold.

```bash
npm run qualify -- add --email="<email>" --name="<name>" --company="<business>" --actor="<operator>"
```

Use --json when needed. Present the result and its missing evidence. Stop if a name is ambiguous; show the candidates.
