"""
Privacy Phase 1 migration.
Adds privacy lifecycle columns to `users` and creates the `audit_logs` table.
Safe to run multiple times — each ALTER is wrapped in its own try/except.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine


def run():
    with engine.begin() as conn:

        # ------------------------------------------------------------------
        # 1. Privacy metadata columns on `users`
        # ------------------------------------------------------------------
        columns = [
            "ALTER TABLE users ADD COLUMN consent_given_at DATETIME NULL;",
            "ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL;",
            "ALTER TABLE users ADD COLUMN anonymized_at DATETIME NULL;",
            "ALTER TABLE users ADD COLUMN retention_expires_at DATETIME NULL;",
            "ALTER TABLE users ADD COLUMN last_accessed_at DATETIME NULL;",
        ]
        for sql in columns:
            try:
                conn.execute(text(sql))
                print(f"  OK: {sql.split('ADD COLUMN')[1].strip()}")
            except Exception as e:
                print(f"  SKIP (already exists?): {e}")

        # ------------------------------------------------------------------
        # 2. audit_logs table
        # ------------------------------------------------------------------
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    action         VARCHAR(50)  NOT NULL,
                    user_id        INT          NULL,
                    target_user_id INT          NULL,
                    ip_address     VARCHAR(45)  NULL,
                    detail         TEXT         NULL,
                    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT fk_audit_user
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """))
            print("  OK: audit_logs table created")
        except Exception as e:
            print(f"  SKIP audit_logs: {e}")

        print("\nMigration complete.")


if __name__ == "__main__":
    run()
