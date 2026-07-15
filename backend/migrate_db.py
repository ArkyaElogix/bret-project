import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE behavioural_types ADD COLUMN form_id INT DEFAULT 1;"))
            conn.execute(text("ALTER TABLE behavioural_types ADD CONSTRAINT fk_form FOREIGN KEY (form_id) REFERENCES forms(id);"))
            # Depending on if the code unique constraint exists and its name
            try:
                conn.execute(text("ALTER TABLE behavioural_types DROP INDEX code;"))
            except Exception as e:
                print(f"Index drop error (might not exist): {e}")
            conn.execute(text("CREATE UNIQUE INDEX uq_form_type_code ON behavioural_types (form_id, code);"))
            print("Migration successful.")
        except Exception as e:
            print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate()
