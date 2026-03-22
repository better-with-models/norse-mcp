/**
 * Observer tools — monitoring, metrics, and event logs.
 */
import { ovGet } from './client.mjs';

export const observerTools = [
  {
    name: 'nordic_get_metrics',
    description: 'Get operational metrics (request rates, latencies, error counts).',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'nordic_get_events',
    description: 'Get recent server-side event log entries.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', default: 50 },
        level: { type: 'string', enum: ['info', 'warn', 'error'], description: 'Filter by log level' },
      },
      required: [],
    },
  },
];

export async function handleObserver(name, args) {
  if (name === 'nordic_get_metrics') return ovGet('/api/v1/metrics');
  if (name === 'nordic_get_events') {
    return ovGet('/api/v1/events', { limit: args.limit ?? 50, level: args.level });
  }
}
