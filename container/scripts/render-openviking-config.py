#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path

TEMPLATE_PATH = Path(os.environ.get("OPENVIKING_TEMPLATE_PATH", "/app/ov.conf.template.json"))
OUTPUT_PATH = Path(os.environ.get("OPENVIKING_CONFIG_OUTPUT", "/app/data/ov.conf"))

def getenv(name: str, default: str = "") -> str:
    value = os.environ.get(name)
    return default if value is None else value

def main() -> int:
    template = json.loads(TEMPLATE_PATH.read_text(encoding="utf-8"))

    dense = template.setdefault("embedding", {}).setdefault("dense", {})
    dense["api_base"] = getenv("OPENVIKING_EMBED_API_BASE", dense.get("api_base", "https://api.openai.com/v1"))
    dense["api_key"] = getenv("OPENVIKING_EMBED_API_KEY", getenv("OPENAI_API_KEY", dense.get("api_key", "")))
    dense["provider"] = getenv("OPENVIKING_EMBED_PROVIDER", dense.get("provider", "openai"))
    dense["dimension"] = int(getenv("OPENVIKING_EMBED_DIMENSION", str(dense.get("dimension", 3072))))
    dense["model"] = getenv("OPENVIKING_EMBED_MODEL", dense.get("model", "text-embedding-3-large"))

    vlm = template.setdefault("vlm", {})
    vlm["api_base"] = getenv("OPENVIKING_VLM_API_BASE", vlm.get("api_base", "https://api.openai.com/v1"))
    vlm["api_key"] = getenv("OPENVIKING_VLM_API_KEY", getenv("OPENAI_API_KEY", vlm.get("api_key", "")))
    vlm["provider"] = getenv("OPENVIKING_VLM_PROVIDER", vlm.get("provider", "openai"))
    vlm["model"] = getenv("OPENVIKING_VLM_MODEL", vlm.get("model", "gpt-4-vision-preview"))
    vlm["max_concurrent"] = int(getenv("OPENVIKING_VLM_MAX_CONCURRENT", str(vlm.get("max_concurrent", 100))))

    server = template.setdefault("server", {})
    server["host"] = getenv("OPENVIKING_HOST", server.get("host", "0.0.0.0"))
    server["root_api_key"] = getenv("OPENVIKING_ROOT_API_KEY", server.get("root_api_key", ""))
    server["port"] = int(getenv("OPENVIKING_INTERNAL_PORT", str(server.get("port", 1934))))

    storage = template.setdefault("storage", {})
    storage["workspace"] = getenv("OPENVIKING_STORAGE_WORKSPACE", storage.get("workspace", "/app/data/workspace"))

    log = template.setdefault("log", {})
    log["level"] = getenv("OPENVIKING_LOG_LEVEL", log.get("level", "INFO"))
    log["output"] = getenv("OPENVIKING_LOG_OUTPUT", log.get("output", "stdout"))

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(template, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
