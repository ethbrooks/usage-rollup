import { parseArgs } from 'node:util';
import { collectUsage } from './rollup.js';
import { sendUsage } from './client.js';

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: 'string', short: 'i', default: 'samples/usage.jsonl' },
      date: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (values.help) {
    process.stdout.write('Usage: node src/index.js --input events.jsonl [--date YYYY-MM-DD] [--dry-run]\n');
    return;
  }

  if (values.date) {
    const parsed = new Date(`${values.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !Number.isFinite(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== values.date) {
      throw new Error('--date must be a valid date in YYYY-MM-DD format');
    }
  }

  const { eventCount, records } = await collectUsage(values.input, values.date);
  const payload = { source: 'worker-events', records };
  if (values['dry-run']) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }
  if (records.length === 0) {
    process.stdout.write('No usage records to submit.\n');
    return;
  }

  const status = await sendUsage(payload);
  process.stdout.write(`Submitted ${records.length} totals from ${eventCount} events (HTTP ${status}).\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
