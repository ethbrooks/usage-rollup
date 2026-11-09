# usage-rollup

Collects worker usage events into daily account totals and submits a single batch.

Requires Node.js 20 or later. There are no package dependencies.

```sh
npm run preview
node src/index.js --input ./events.jsonl --date 2026-11-01
```

Each input line contains `timestamp`, `account`, `metric`, and `units`. Dates are grouped in UTC. Use `--dry-run` to print the batch to stdout.
