import { ovGet } from './client.mjs';

export const healthTools = [
  {
    name: 'nordic_health_check',
    description: 'Check that the OpenViking server is reachable and healthy.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

export async function handleHealth(name, _args) {
  if (name === 'nordic_health_check') {
    return ovGet('/health');
  }
}
