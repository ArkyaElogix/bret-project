"""Generate schema.sql from SQLAlchemy models (MariaDB/MySQL dialect).

Run this from the repository root to rewrite `schema.sql` with the
DDL for the current SQLAlchemy `Base` metadata.

Usage:
    python backend/generate_schema_sql.py

This script does not connect to a database; it emits CREATE TABLE
statements using the MySQL dialect so you can apply them to a MariaDB
server.
"""
from pathlib import Path
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import mysql

import backend.app.models.models as models_module


def main():
    metadata = models_module.Base.metadata
    out = []

    out.append("-- Generated schema.sql from SQLAlchemy models\n")
    # Emit DROP TABLE IF EXISTS in reverse dependency order
    for table in reversed(metadata.sorted_tables):
        out.append(f"DROP TABLE IF EXISTS `{table.name}`;\n")

    out.append("\nSET FOREIGN_KEY_CHECKS=1;\n\n")

    # Emit CREATE TABLE statements
    dialect = mysql.dialect()
    for table in metadata.sorted_tables:
        ddl = str(CreateTable(table).compile(dialect=dialect, compile_kwargs={"literal_binds": True}))
        out.append(ddl + ";\n\n")

    target = Path(__file__).resolve().parents[1] / "schema.sql"
    target.write_text("".join(out), encoding="utf-8")
    print(f"Wrote {target}")


if __name__ == "__main__":
    main()
