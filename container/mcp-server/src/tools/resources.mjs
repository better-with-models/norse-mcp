import { z } from 'zod';
import { buildTenantHeaders, normalizeUriAlias } from '../client.mjs';

function text(v) {
  return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

export function register(server, client, _config) {
  // ── ov_resources_temp_upload ─────────────────────────────────────────────────
  // Multipart upload to /api/v1/resources/temp_upload.
  // Returns temp_path which is then passed to ov_resources_create.
  server.tool(
    'ov_resources_temp_upload',
    'Upload a file to the OpenViking temporary storage area (step 1 of 3-step ingest). ' +
    'Returns a temp_path for use with ov_resources_create.',
    {
      content:    z.string().describe('Text content to upload'),
      filename:   z.string().describe('Filename, e.g. notes.md'),
      mime_type:  z.string().optional().describe('MIME type (default: text/plain)'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ content, filename, mime_type, account_id, user_id }) => {
      const form = new FormData();
      form.append('file', new Blob([content], { type: mime_type ?? 'text/plain' }), filename);
      const r = await client.formPost(
        '/api/v1/resources/temp_upload', form,
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_resources_create ──────────────────────────────────────────────────────
  // Creates a resource from a path (temp file path, directory, or URL).
  // Step 2 of 3-step ingest: converts temp_path → viking://resources/… root_uri.
  server.tool(
    'ov_resources_create',
    'Create an OpenViking resource from a path (step 2 of 3-step ingest). ' +
    'Pass the temp_path from ov_resources_temp_upload. Returns root_uri for ov_fs_move.',
    {
      path:           z.string().describe('Path to ingest: temp file path, directory, or URL'),
      target:         z.string().optional().describe('Viking URI target in resources scope'),
      reason:         z.string().optional(),
      instruction:    z.string().optional(),
      wait:           z.boolean().optional().describe('Block until processing completes'),
      timeout:        z.number().optional().describe('Timeout seconds (used when wait=true)'),
      watch_interval: z.number().optional().describe('Watch interval minutes (>0 enables)'),
      account_id:     z.string().optional(),
      user_id:        z.string().optional(),
    },
    async ({ path, target, reason, instruction, wait, timeout, watch_interval, account_id, user_id }) => {
      const body = {
        path,
        ...(target         != null && { to: normalizeUriAlias(target) }),
        ...(reason         != null && { reason }),
        ...(instruction    != null && { instruction }),
        ...(wait           != null && { wait }),
        ...(timeout        != null && { timeout }),
        ...(watch_interval != null && { watch_interval }),
      };
      const r = await client.fetch(
        '/api/v1/resources',
        { method: 'POST', body: JSON.stringify(body) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );

  // ── ov_skills_create ─────────────────────────────────────────────────────────
  server.tool(
    'ov_skills_create',
    'Create an OpenViking skill from inline data or a file path.',
    {
      data:       z.union([z.string(), z.record(z.unknown())]).describe('Skill data (inline object or path)'),
      account_id: z.string().optional(),
      user_id:    z.string().optional(),
    },
    async ({ data, account_id, user_id }) => {
      const r = await client.fetch(
        '/api/v1/skills',
        { method: 'POST', body: JSON.stringify({ data }) },
        buildTenantHeaders({ account_id, user_id })
      );
      return text(r);
    }
  );
}
