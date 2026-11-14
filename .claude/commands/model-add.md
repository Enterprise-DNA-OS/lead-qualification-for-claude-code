# model-add

Copy fixtures/policy.json into a private policy file and edit the documented fields. Create a new named version. No trained vendor model transfers.

```bash
npm run qualify -- model-add --file="<policy file>" --name="<version name>" --actor="<operator>"
```

Use --json when needed. Present the result and its missing evidence. Stop if a name is ambiguous; show the candidates.
