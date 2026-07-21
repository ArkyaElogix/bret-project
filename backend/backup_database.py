"""
Export the current MariaDB database contents before destructive migrations.

This script is read-only. It creates a timestamped folder under db_backups/
containing:
- metadata.json: database name, table order, row counts
- tables/<table>.json: every row from every table
- restore_data.sql: INSERT statements for restoring data into an existing schema

Run from Projects/bret-project/backend:
    python backup_database.py
"""

from __future__ import annotations

import base64
import json
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import inspect, text

from app.database import DB_NAME, engine


BACKUP_ROOT = Path(__file__).resolve().parent / "db_backups"


def json_default(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, bytes):
        return {"__bytes_base64__": base64.b64encode(value).decode("ascii")}
    return str(value)


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float, Decimal)):
        return str(value)
    if isinstance(value, (datetime, date)):
        value = value.isoformat(sep=" ") if isinstance(value, datetime) else value.isoformat()
    if isinstance(value, bytes):
        value = base64.b64encode(value).decode("ascii")

    escaped = str(value).replace("\\", "\\\\").replace("'", "''")
    return f"'{escaped}'"


def quote_identifier(identifier: str) -> str:
    return f"`{identifier.replace('`', '``')}`"


def write_table_json(table_dir: Path, table_name: str, rows: list[dict[str, Any]]) -> None:
    output_path = table_dir / f"{table_name}.json"
    output_path.write_text(
        json.dumps(rows, indent=2, ensure_ascii=False, default=json_default),
        encoding="utf-8",
    )


def build_insert_sql(table_name: str, rows: list[dict[str, Any]]) -> list[str]:
    if not rows:
        return [f"-- {quote_identifier(table_name)}: 0 rows"]

    columns = list(rows[0].keys())
    quoted_columns = ", ".join(quote_identifier(column) for column in columns)
    statements = [f"-- {quote_identifier(table_name)}: {len(rows)} rows"]

    for row in rows:
        values = ", ".join(sql_literal(row[column]) for column in columns)
        statements.append(
            f"INSERT INTO {quote_identifier(table_name)} ({quoted_columns}) VALUES ({values});"
        )

    return statements


def main() -> None:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = BACKUP_ROOT / f"{DB_NAME}_{timestamp}"
    table_dir = backup_dir / "tables"
    table_dir.mkdir(parents=True, exist_ok=True)

    metadata: dict[str, Any] = {
        "database": DB_NAME,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "tables": [],
    }
    restore_sql: list[str] = [
        f"-- Data backup for database {quote_identifier(DB_NAME)}",
        f"-- Created at {metadata['created_at']}",
        "SET FOREIGN_KEY_CHECKS=0;",
        "",
    ]

    with engine.connect() as conn:
        inspector = inspect(conn)
        table_names = inspector.get_table_names()

        for table_name in table_names:
            result = conn.execute(text(f"SELECT * FROM {quote_identifier(table_name)}"))
            rows = [dict(row._mapping) for row in result]

            write_table_json(table_dir, table_name, rows)
            restore_sql.extend(build_insert_sql(table_name, rows))
            restore_sql.append("")

            metadata["tables"].append(
                {
                    "name": table_name,
                    "row_count": len(rows),
                    "columns": list(rows[0].keys()) if rows else [
                        column["name"] for column in inspector.get_columns(table_name)
                    ],
                }
            )

    restore_sql.extend(["SET FOREIGN_KEY_CHECKS=1;", ""])

    (backup_dir / "metadata.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (backup_dir / "restore_data.sql").write_text("\n".join(restore_sql), encoding="utf-8")

    print(f"Backup created: {backup_dir}")
    for table in metadata["tables"]:
        print(f"- {table['name']}: {table['row_count']} rows")


if __name__ == "__main__":
    main()
