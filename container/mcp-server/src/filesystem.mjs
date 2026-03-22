/**
 * Filesystem-backed content operations (upload files into collections).
 */
import { ovGet, ovPost, ovDelete } from './client.mjs';

export const filesystemTools = [
  {
    name: 'nordic_upload_file',
    description: 'Upload a local file into a collection (text or binary with VLM processing).',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        file_path: { type: 'string', description: 'Absolute path to the file on the server filesystem' },
        item_id: { type: 'string', description: 'ID to assign to the uploaded item' },
        metadata: { type: 'object' },
      },
      required: ['collection', 'file_path', 'item_id'],
    },
  },
  {
    name: 'nordic_list_files',
    description: 'List files tracked in a collection.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
      },
      required: ['collection'],
    },
  },
  {
    name: 'nordic_delete_file',
    description: 'Remove a file-backed item from a collection.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        item_id: { type: 'string' },
      },
      required: ['collection', 'item_id'],
    },
  },
];

export async function handleFilesystem(name, args) {
  if (name === 'nordic_upload_file') {
    return ovPost(`/api/v1/collections/${args.collection}/files`, {
      file_path: args.file_path,
      item_id: args.item_id,
      metadata: args.metadata,
    });
  }
  if (name === 'nordic_list_files') {
    return ovGet(`/api/v1/collections/${args.collection}/files`);
  }
  if (name === 'nordic_delete_file') {
    return ovDelete(`/api/v1/collections/${args.collection}/files/${args.item_id}`);
  }
}
