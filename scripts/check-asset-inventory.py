#!/usr/bin/env python3
"""Validate the portable refinement inventory's structure, not its factual claims."""
import csv
import sys
from pathlib import Path

FIELDS = ("asset_id", "area", "asset_type", "name", "status", "level", "evidence", "next_refinement", "unknowns")
STATUSES = {"existing", "planned"}
LEVELS = {"", "0", "1", "2", "3", "4", "5"}


def validate(path):
    errors = []
    seen = set()
    with Path(path).open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != list(FIELDS):
            return ["Header must match the template, in order"]
        for line, row in enumerate(reader, 2):
            if None in row or any(value is None for value in row.values()):
                errors.append(f"Line {line}: wrong number of fields")
                continue
            row = {key: value.strip() for key, value in row.items()}
            for field in FIELDS:
                if field != "level" and not row[field]:
                    errors.append(f"Line {line}: {field} is required")
            if row["asset_id"] in seen:
                errors.append(f"Line {line}: duplicate asset_id {row['asset_id']!r}")
            seen.add(row["asset_id"])
            if row["status"] not in STATUSES:
                errors.append(f"Line {line}: status must be existing or planned")
            if row["level"] not in LEVELS:
                errors.append(f"Line {line}: level must be blank or an integer from 0 through 5")
            if row["status"] == "planned" and row["level"]:
                errors.append(f"Line {line}: planned assets must have a blank level")
    return errors


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/check-asset-inventory.py INVENTORY.csv", file=sys.stderr)
        return 2
    try:
        errors = validate(sys.argv[1])
    except (OSError, UnicodeError, csv.Error) as exc:
        print(f"Cannot read inventory: {exc}", file=sys.stderr)
        return 2
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("Inventory structure valid; evidence and assignments require human review.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
