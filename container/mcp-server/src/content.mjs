/**
 * Content chunking and retrieval operations.
 */
import { ovGet, ovPost } from './client.mjs';

export const contentTools = [
  {
    name: 'nordic_chunk_and_store',
    description: 'Chunk a long text document and store all chunks in a collection.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        text: { type: 'string', description: 'Full document text to chunk and embed' },
        doc_id: { type: 'string', description: 'Base ID for generated chunk IDs' },
        chunk_size: { type: 'integer', default: 512, description: 'Target chunk size in tokens' },
        chunk_overlap: { type: 'integer', default: 64 },
        metadata: { type: 'object' },
      },
      required: ['collection', 'text', 'doc_id'],
    },
  },
  {
    name: 'nordic_get_chunk',
    description: 'Retrieve a specific chunk by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        chunk_id: { type: 'string' },
      },
      required: ['collection', 'chunk_id'],
    },
  },
];

export async function handleContent(name, args) {
  if (name === 'nordic_chunk_and_store') {
    return ovPost(`/api/v1/collections/${args.collection}/content/chunk`, {
      text: args.text,
      doc_id: args.doc_id,
      chunk_size: args.chunk_size ?? 512,
      chunk_overlap: args.chunk_overlap ?? 64,
      metadata: args.metadata,
    });
  }
  if (name === 'nordic_get_chunk') {
    return ovGet(`/api/v1/collections/${args.collection}/content/${args.chunk_id}`);
  }
}
