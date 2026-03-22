import { ovGet } from './client.mjs';

export const systemTools = [
  {
    name: 'nordic_system_info',
    description: 'Get OpenViking server version, configuration, and capabilities.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'nordic_system_stats',
    description: 'Get runtime statistics: collection count, total vectors, memory usage.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

export async function handleSystem(name, _args) {
  if (name === 'nordic_system_info') return ovGet('/api/v1/system/info');
  if (name === 'nordic_system_stats') return ovGet('/api/v1/system/stats');
}
