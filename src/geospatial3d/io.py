# SPDX-License-Identifier: Apache-2.0
"""Verified input caching and provenance. No project-specific providers are embedded."""

import hashlib
import json
from pathlib import Path
import subprocess

import requests


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def sha256(path):
    with Path(path).open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def text_sha256(path):
    """Portable UTF-8 text digest, without BOM and with LF line endings.

    Opt-in companion to the raw build-byte digest; never use for binary inputs.
    """
    text = Path(path).read_text(encoding='utf-8-sig')
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def fetch_source(source, cache):
    path = Path(cache) / source["filename"]
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        partial = path.with_suffix(path.suffix + ".part")
        with requests.get(source["url"], stream=True, timeout=(30, 180)) as response:
            response.raise_for_status()
            with partial.open("wb") as f:
                for block in response.iter_content(4 * 1024 * 1024):
                    f.write(block)
        if sha256(partial) != source["sha256"]:
            raise ValueError(f"Checksum mismatch for {source['id']}; keeping .part for inspection")
        partial.replace(path)
    actual = sha256(path)
    if actual != source["sha256"]:
        raise ValueError(f"Cached input checksum mismatch: {path}")
    return path


def revision():
    root = Path(__file__).resolve().parents[2]
    def git(*args):
        return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()
    try:
        return {"commit": git("rev-parse", "HEAD"), "dirty": bool(git("status", "--porcelain"))}
    except (OSError, subprocess.CalledProcessError):
        return {"commit": None, "dirty": None}
