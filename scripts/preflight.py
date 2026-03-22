#!/usr/bin/env python3
"""
nordic-mcp preflight checker.

Verifies that the environment is ready to start the nordic-mcp Docker stack.
Run this before /nordic-mcp-start or docker compose up.

Usage:
    python scripts/preflight.py
"""

import os
import shutil
import socket
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
CONTAINER_DIR = REPO_ROOT / "container"
ENV_FILE = CONTAINER_DIR / ".env"
ENV_EXAMPLE = CONTAINER_DIR / ".env.example"
PUBLIC_PORT = 1933
REQUIRED_ENV_VARS = ["OPENVIKING_ROOT_API_KEY", "OPENAI_API_KEY"]
PLACEHOLDER_VALUES = {"change-me", "sk-...", ""}


def check(label: str, passed: bool, detail: str = "") -> bool:
    icon = "OK" if passed else "FAIL"
    msg = f"  [{icon}] {label}"
    if detail:
        msg += f"\n         {detail}"
    print(msg)
    return passed


def check_docker_binary() -> bool:
    path = shutil.which("docker")
    return check("docker binary on PATH", path is not None, path or "Install Docker Desktop")


def check_docker_daemon() -> bool:
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        ok = result.returncode == 0
        return check(
            "Docker daemon running",
            ok,
            "" if ok else "Start Docker Desktop or the Docker daemon",
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return check("Docker daemon running", False, "Could not reach Docker daemon")


def check_docker_compose() -> bool:
    try:
        result = subprocess.run(
            ["docker", "compose", "version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        ok = result.returncode == 0
        version = result.stdout.strip() if ok else "not found"
        return check("Docker Compose available", ok, version)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return check("Docker Compose available", False, "Upgrade Docker Desktop (includes Compose v2)")


def check_env_file() -> bool:
    exists = ENV_FILE.exists()
    if not exists:
        return check(
            ".env file exists",
            False,
            f"Run: cp {ENV_EXAMPLE.name} .env  (in {CONTAINER_DIR})",
        )
    return check(".env file exists", True, str(ENV_FILE))


def load_env() -> dict:
    env = {}
    if not ENV_FILE.exists():
        return env
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def check_env_vars(env: dict) -> bool:
    all_ok = True
    for var in REQUIRED_ENV_VARS:
        value = env.get(var, "")
        ok = value not in PLACEHOLDER_VALUES
        if not check(
            f"{var} set",
            ok,
            "" if ok else f"Edit container/.env and set a real value for {var}",
        ):
            all_ok = False
    return all_ok


def check_data_dir(env: dict) -> bool:
    data_path_str = env.get("NORDIC_MCP_DATA", os.path.expanduser("~/.nordic_mcp/openviking-data"))
    # Expand $HOME / ${HOME}
    data_path_str = data_path_str.replace("${HOME}", os.path.expanduser("~")).replace(
        "$HOME", os.path.expanduser("~")
    )
    data_path = Path(data_path_str)
    try:
        data_path.mkdir(parents=True, exist_ok=True)
        return check("Data directory writable", True, str(data_path))
    except OSError as e:
        return check("Data directory writable", False, f"{data_path}: {e}")


def check_port(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        in_use = s.connect_ex(("127.0.0.1", port)) == 0
    if in_use:
        return check(
            f"Port {port} available",
            False,
            f"Port {port} is already in use. Stop the conflicting process or change PUBLIC_PORT in docker-compose.yml",
        )
    return check(f"Port {port} available", True)


def main() -> int:
    print("nordic-mcp preflight check")
    print("=" * 40)

    results = []
    results.append(check_docker_binary())
    results.append(check_docker_daemon())
    results.append(check_docker_compose())
    results.append(check_env_file())

    env = load_env()
    results.append(check_env_vars(env))
    results.append(check_data_dir(env))
    results.append(check_port(PUBLIC_PORT))

    print("=" * 40)
    passed = sum(results)
    total = len(results)
    print(f"Result: {passed}/{total} checks passed")

    if passed == total:
        print("\nAll checks passed. Ready to start:")
        print("  cd container && docker compose up -d")
        return 0
    else:
        failed = total - passed
        print(f"\n{failed} check(s) failed. Fix the issues above before starting the stack.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
