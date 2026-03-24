"""Runtime patch overlay for the pinned OpenViking base image.

This file is copied into site-packages during the Docker build so Python loads
it automatically on interpreter startup. The patch keeps the repo pinned to the
upstream OpenViking image while fixing two local integration issues:

1. Non-finite search scores can escape into FastAPI JSON serialization.
2. Blank overview/abstract artifacts can be persisted when using local
   OpenAI-compatible endpoints such as LM Studio.
"""

from __future__ import annotations

import logging
import math
from dataclasses import replace

logger = logging.getLogger("nordic_mcp.openviking_patch")


def _uri_leaf_name(uri: str) -> str:
    value = (uri or "").rstrip("/")
    if not value:
        return "resources"
    if value.endswith("://"):
        return value[:-3] or "resources"
    leaf = value.rsplit("/", 1)[-1]
    return leaf or "resources"


def _parent_uri(uri: str) -> str:
    value = uri or ""
    if "/" not in value:
        return value
    return value.rsplit("/", 1)[0]


def _default_overview(uri: str) -> str:
    return f"# {_uri_leaf_name(uri)}\n\nDirectory overview"


def _default_abstract(uri: str) -> str:
    return f"{_uri_leaf_name(uri)} directory overview"


def _as_text(content) -> str:
    if isinstance(content, bytes):
        return content.decode("utf-8", errors="replace")
    if content is None:
        return ""
    return str(content)


def _is_blank(content) -> bool:
    return not _as_text(content).strip()


def _coerce_finite_float(value):
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if math.isfinite(result) else None


def _format_score_context(record) -> str:
    if not isinstance(record, dict):
        return ""
    pieces = []
    for key in ("uri", "context_type", "level", "account_id", "owner_space"):
        value = record.get(key)
        if value not in (None, ""):
            pieces.append(f"{key}={value}")
    return " ".join(pieces)


def _log_blank_overview(dir_uri: str, kind: str, prompt_chars: int, extra: str = "") -> None:
    from openviking.storage.queuefs.semantic_processor import get_openviking_config

    vlm = get_openviking_config().vlm
    logger.warning(
        "[nordic-mcp patch] Blank VLM overview output (%s); using fallback for %s "
        "(provider=%s model=%s prompt_chars=%s%s)",
        kind,
        dir_uri,
        getattr(vlm, "provider", "unknown"),
        getattr(vlm, "model", ""),
        prompt_chars,
        extra,
    )


def _patch_hierarchical_retriever() -> None:
    from datetime import datetime

    from openviking.retrieve import hierarchical_retriever as hr_mod
    from openviking_cli.retrieve.types import ContextType, MatchedContext, QueryResult, RelatedContext

    if getattr(hr_mod.HierarchicalRetriever, "_nordic_mcp_patched", False):
        return

    original_convert = hr_mod.HierarchicalRetriever._convert_to_matched_contexts
    original_retrieve = hr_mod.HierarchicalRetriever.retrieve
    original_rerank_scores = hr_mod.HierarchicalRetriever._rerank_scores

    async def patched_convert_to_matched_contexts(self, candidates, ctx):
        results = []

        for candidate in candidates:
            relations = []
            if hr_mod.get_viking_fs():
                related_uris = await hr_mod.get_viking_fs().get_relations(
                    candidate.get("uri", ""),
                    ctx=ctx,
                )
                if related_uris:
                    related_abstracts = await hr_mod.get_viking_fs().read_batch(
                        related_uris[: self.MAX_RELATIONS],
                        level="l0",
                        ctx=ctx,
                    )
                    for relation_uri in related_uris[: self.MAX_RELATIONS]:
                        abstract = related_abstracts.get(relation_uri, "")
                        if abstract:
                            relations.append(RelatedContext(uri=relation_uri, abstract=abstract))

            raw_semantic = candidate.get("_final_score", candidate.get("_score", 0.0))
            semantic_score = _coerce_finite_float(raw_semantic)
            if semantic_score is None:
                logger.warning(
                    "[nordic-mcp patch] Dropping candidate with non-finite semantic score "
                    "uri=%s _final_score=%r _score=%r",
                    candidate.get("uri", ""),
                    candidate.get("_final_score"),
                    candidate.get("_score"),
                )
                continue

            updated_at_raw = candidate.get("updated_at")
            if isinstance(updated_at_raw, str):
                try:
                    updated_at_val = hr_mod.parse_iso_datetime(updated_at_raw)
                except (ValueError, TypeError):
                    updated_at_val = None
            elif isinstance(updated_at_raw, datetime):
                updated_at_val = updated_at_raw
            else:
                updated_at_val = None

            try:
                raw_hotness = hr_mod.hotness_score(
                    active_count=candidate.get("active_count", 0),
                    updated_at=updated_at_val,
                )
            except Exception as exc:
                logger.warning(
                    "[nordic-mcp patch] Hotness scoring failed for %s: %s",
                    candidate.get("uri", ""),
                    exc,
                )
                raw_hotness = 0.0

            hotness_score = _coerce_finite_float(raw_hotness)
            if hotness_score is None:
                logger.warning(
                    "[nordic-mcp patch] Replacing non-finite hotness score for %s: %r",
                    candidate.get("uri", ""),
                    raw_hotness,
                )
                hotness_score = 0.0

            alpha = self.HOTNESS_ALPHA
            raw_final = (1 - alpha) * semantic_score + alpha * hotness_score
            final_score = _coerce_finite_float(raw_final)
            if final_score is None:
                logger.warning(
                    "[nordic-mcp patch] Replacing non-finite blended score for %s: %r",
                    candidate.get("uri", ""),
                    raw_final,
                )
                final_score = semantic_score

            level = candidate.get("level", 2)
            display_uri = self._append_level_suffix(candidate.get("uri", ""), level)

            results.append(
                MatchedContext(
                    uri=display_uri,
                    context_type=ContextType(candidate["context_type"])
                    if candidate.get("context_type")
                    else ContextType.RESOURCE,
                    level=level,
                    abstract=candidate.get("abstract", ""),
                    category=candidate.get("category", ""),
                    score=final_score,
                    relations=relations,
                )
            )

        results.sort(key=lambda item: item.score, reverse=True)
        return results

    async def patched_retrieve(self, *args, **kwargs):
        result = await original_retrieve(self, *args, **kwargs)
        safe_matches = []

        for match in result.matched_contexts:
            safe_score = _coerce_finite_float(getattr(match, "score", None))
            if safe_score is None:
                logger.warning(
                    "[nordic-mcp patch] Dropping matched context with non-finite final score "
                    "uri=%s score=%r",
                    getattr(match, "uri", ""),
                    getattr(match, "score", None),
                )
                continue
            safe_matches.append(match if safe_score == match.score else replace(match, score=safe_score))

        return QueryResult(
            query=result.query,
            matched_contexts=safe_matches,
            searched_directories=result.searched_directories,
            thinking_trace=result.thinking_trace,
        )

    def patched_rerank_scores(self, query, documents, fallback_scores):
        scores = original_rerank_scores(self, query, documents, fallback_scores)
        normalized_scores = []

        for idx, (score, fallback) in enumerate(zip(scores, fallback_scores)):
            finite_score = _coerce_finite_float(score)
            if finite_score is None:
                safe_fallback = _coerce_finite_float(fallback)
                logger.warning(
                    "[nordic-mcp patch] Invalid rerank score at index=%s score=%r fallback=%r; "
                    "using %r",
                    idx,
                    score,
                    fallback,
                    safe_fallback if safe_fallback is not None else 0.0,
                )
                normalized_scores.append(safe_fallback if safe_fallback is not None else 0.0)
                continue
            normalized_scores.append(finite_score)

        return normalized_scores

    hr_mod.HierarchicalRetriever._convert_to_matched_contexts = patched_convert_to_matched_contexts
    hr_mod.HierarchicalRetriever.retrieve = patched_retrieve
    hr_mod.HierarchicalRetriever._rerank_scores = patched_rerank_scores
    hr_mod.HierarchicalRetriever._nordic_mcp_patched = True


def _patch_vectordb_adapter() -> None:
    from openviking.storage.vectordb_adapters import base as adapter_mod

    if getattr(adapter_mod.CollectionAdapter, "_nordic_mcp_patched", False):
        return

    original_query = adapter_mod.CollectionAdapter.query

    def patched_query(
        self,
        *,
        query_vector=None,
        sparse_query_vector=None,
        filter=None,
        limit=10,
        offset=0,
        output_fields=None,
        order_by=None,
        order_desc=False,
    ):
        records = original_query(
            self,
            query_vector=query_vector,
            sparse_query_vector=sparse_query_vector,
            filter=filter,
            limit=limit,
            offset=offset,
            output_fields=output_fields,
            order_by=order_by,
            order_desc=order_desc,
        )

        safe_records = []
        for record in records:
            raw_score = record.get("_score", 0.0)
            finite_score = _coerce_finite_float(raw_score)
            if finite_score is None:
                logger.warning(
                    "[nordic-mcp patch] Dropping vector result with non-finite raw score "
                    "score=%r %s",
                    raw_score,
                    _format_score_context(record),
                )
                continue

            if finite_score != raw_score:
                record = dict(record)
                record["_score"] = finite_score
            safe_records.append(record)

        return safe_records

    adapter_mod.CollectionAdapter.query = patched_query
    adapter_mod.CollectionAdapter._nordic_mcp_patched = True


def _patch_semantic_processor() -> None:
    import re

    from openviking.storage.queuefs import semantic_processor as sp_mod

    if getattr(sp_mod.SemanticProcessor, "_nordic_mcp_patched", False):
        return

    original_single = sp_mod.SemanticProcessor._single_generate_overview

    async def patched_single_generate_overview(
        self,
        dir_uri,
        file_summaries_str,
        children_abstracts_str,
        file_index_map,
    ):
        overview = await original_single(
            self,
            dir_uri,
            file_summaries_str,
            children_abstracts_str,
            file_index_map,
        )
        if _is_blank(overview):
            _log_blank_overview(
                dir_uri,
                "single",
                len(file_summaries_str) + len(children_abstracts_str),
            )
            return _default_overview(dir_uri)
        return overview

    async def patched_batched_generate_overview(
        self,
        dir_uri,
        file_summaries,
        children_abstracts,
        file_index_map,
    ):
        vlm = sp_mod.get_openviking_config().vlm
        semantic = sp_mod.get_openviking_config().semantic
        batch_size = semantic.overview_batch_size
        dir_name = _uri_leaf_name(dir_uri)

        batches = [
            file_summaries[i : i + batch_size]
            for i in range(0, len(file_summaries), batch_size)
        ]
        sp_mod.logger.info("Generating overview for %s in %s batches", dir_uri, len(batches))

        children_abstracts_str = (
            "\n".join(f"- {item['name']}/: {item['abstract']}" for item in children_abstracts)
            if children_abstracts
            else "None"
        )

        partial_overviews = []
        global_offset = 0
        for batch_idx, batch in enumerate(batches):
            batch_lines = []
            batch_index_map = {}
            for local_idx, item in enumerate(batch):
                global_idx = global_offset + local_idx + 1
                batch_index_map[global_idx] = item["name"]
                batch_lines.append(f"[{global_idx}] {item['name']}: {item['summary']}")
            batch_str = "\n".join(batch_lines)
            global_offset += len(batch)

            children_str = children_abstracts_str if batch_idx == 0 else "None"
            prompt_chars = len(batch_str) + len(children_str)

            try:
                prompt = sp_mod.render_prompt(
                    "semantic.overview_generation",
                    {
                        "dir_name": dir_name,
                        "file_summaries": batch_str,
                        "children_abstracts": children_str,
                    },
                )
                partial = await vlm.get_completion_async(prompt)

                if _is_blank(partial):
                    _log_blank_overview(
                        dir_uri,
                        "batch",
                        prompt_chars,
                        extra=f" batch={batch_idx + 1}/{len(batches)}",
                    )
                    continue

                def make_replacer(idx_map):
                    def replacer(match):
                        idx = int(match.group(1))
                        return idx_map.get(idx, match.group(0))

                    return replacer

                partial = re.sub(r"\[(\d+)\]", make_replacer(batch_index_map), partial).strip()
                if not partial:
                    _log_blank_overview(
                        dir_uri,
                        "batch-postprocess",
                        prompt_chars,
                        extra=f" batch={batch_idx + 1}/{len(batches)}",
                    )
                    continue
                partial_overviews.append(partial)
            except Exception as exc:
                sp_mod.logger.warning(
                    "Failed to generate partial overview batch %s/%s for %s: %s",
                    batch_idx + 1,
                    len(batches),
                    dir_uri,
                    exc,
                )

        if not partial_overviews:
            return _default_overview(dir_uri)

        if len(partial_overviews) == 1:
            return partial_overviews[0]

        combined = "\n\n---\n\n".join(partial_overviews)
        prompt_chars = len(combined) + len(children_abstracts_str)
        try:
            prompt = sp_mod.render_prompt(
                "semantic.overview_generation",
                {
                    "dir_name": dir_name,
                    "file_summaries": combined,
                    "children_abstracts": children_abstracts_str,
                },
            )
            overview = await vlm.get_completion_async(prompt)
            if _is_blank(overview):
                _log_blank_overview(dir_uri, "merge", prompt_chars)
                return partial_overviews[0]
            overview = overview.strip()
            return overview or partial_overviews[0]
        except Exception as exc:
            sp_mod.logger.error(
                "Failed to merge partial overviews for %s: %s",
                dir_uri,
                exc,
                exc_info=True,
            )
            return partial_overviews[0]

    sp_mod.SemanticProcessor._single_generate_overview = patched_single_generate_overview
    sp_mod.SemanticProcessor._batched_generate_overview = patched_batched_generate_overview
    sp_mod.SemanticProcessor._nordic_mcp_patched = True


def _patch_viking_fs() -> None:
    from openviking.storage import viking_fs as vfs_mod

    if getattr(vfs_mod.VikingFS, "_nordic_mcp_patched", False):
        return

    original_write_file = vfs_mod.VikingFS.write_file
    original_abstract = vfs_mod.VikingFS.abstract
    original_overview = vfs_mod.VikingFS.overview

    async def patched_write_file(self, uri, content, ctx=None):
        if uri.endswith("/.overview.md") and _is_blank(content):
            logger.warning(
                "[nordic-mcp patch] Replacing blank overview artifact write for %s",
                _parent_uri(uri),
            )
            content = _default_overview(_parent_uri(uri))
        elif uri.endswith("/.abstract.md") and _is_blank(content):
            logger.warning(
                "[nordic-mcp patch] Replacing blank abstract artifact write for %s",
                _parent_uri(uri),
            )
            content = _default_abstract(_parent_uri(uri))
        return await original_write_file(self, uri, content, ctx=ctx)

    async def patched_abstract(self, uri, ctx=None):
        content = await original_abstract(self, uri, ctx=ctx)
        if _is_blank(content):
            logger.warning(
                "[nordic-mcp patch] Returning fallback abstract for blank artifact at %s",
                uri,
            )
            return _default_abstract(uri)
        return content

    async def patched_overview(self, uri, ctx=None):
        content = await original_overview(self, uri, ctx=ctx)
        if _is_blank(content):
            logger.warning(
                "[nordic-mcp patch] Returning fallback overview for blank artifact at %s",
                uri,
            )
            return _default_overview(uri)
        return content

    vfs_mod.VikingFS.write_file = patched_write_file
    vfs_mod.VikingFS.abstract = patched_abstract
    vfs_mod.VikingFS.overview = patched_overview
    vfs_mod.VikingFS._nordic_mcp_patched = True


def _apply_patch_overlay() -> None:
    _patch_vectordb_adapter()
    _patch_hierarchical_retriever()
    _patch_semantic_processor()
    _patch_viking_fs()
    logger.info("[nordic-mcp patch] OpenViking runtime patch overlay active")


try:
    _apply_patch_overlay()
except Exception as exc:  # pragma: no cover - startup safety net
    logger.exception("[nordic-mcp patch] Failed to apply OpenViking runtime patch overlay: %s", exc)
