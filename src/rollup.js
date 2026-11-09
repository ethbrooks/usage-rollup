import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

function parseEvent(line, lineNumber) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    throw new Error(`Line ${lineNumber}: invalid JSON`);
  }

  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new Error(`Line ${lineNumber}: expected an event object`);
  }

  const validName = (value) => typeof value === 'string' && value.trim() !== '';
  if (!validName(event.account) || !validName(event.metric)) {
    throw new Error(`Line ${lineNumber}: account and metric are required`);
  }
  if (typeof event.units !== 'number' || !Number.isFinite(event.units) || event.units < 0) {
    throw new Error(`Line ${lineNumber}: units must be a nonnegative number`);
  }
  if (typeof event.timestamp !== 'string' || !Number.isFinite(Date.parse(event.timestamp))) {
    throw new Error(`Line ${lineNumber}: invalid timestamp`);
  }

  return { ...event, day: new Date(event.timestamp).toISOString().slice(0, 10) };
}

export async function collectUsage(inputPath, selectedDay) {
  const stream = createReadStream(inputPath, { encoding: 'utf8' });
  const lines = createInterface({ input: stream, crlfDelay: Infinity });
  const totals = new Map();
  let lineNumber = 0;
  let eventCount = 0;

  try {
    for await (const line of lines) {
      lineNumber += 1;
      if (!line.trim()) continue;
      const event = parseEvent(line, lineNumber);
      if (selectedDay && event.day !== selectedDay) continue;

      const key = JSON.stringify([event.day, event.account, event.metric]);
      const row = totals.get(key) ?? {
        date: event.day,
        account: event.account,
        metric: event.metric,
        units: 0,
      };
      row.units += event.units;
      if (!Number.isFinite(row.units)) {
        throw new Error(`Line ${lineNumber}: usage total exceeds numeric range`);
      }
      totals.set(key, row);
      eventCount += 1;
    }
  } finally {
    lines.close();
    stream.destroy();
  }

  const records = [...totals.values()].sort((a, b) =>
    a.date.localeCompare(b.date) || a.account.localeCompare(b.account) || a.metric.localeCompare(b.metric)
  );
  return { eventCount, records };
}
