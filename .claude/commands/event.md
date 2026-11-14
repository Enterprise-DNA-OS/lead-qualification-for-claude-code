---
description: "Record an observed event with a unique source key."
---

# event

Record an observed event with a unique source key. Kinds: demo_requested, trial_started, pricing_viewed, active_day, meeting_held. Then re-score.

```bash
npm run qualify -- event --contact="<email>" --kind=demo_requested --at="<ISO timestamp>" --key="<source event ID>" --evidence="<reference>" --actor="<operator>"
```

Use --json when needed. Present the result and its missing evidence. Stop if a name is ambiguous; show the candidates.
