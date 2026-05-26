import os
from sqlalchemy import text
from database import engine

MIGRATIONS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "new_features", "appointment_arc", "migrations"
)

# Explicit sequence
MIGRATION_FILES = [
    "006_reservation_tier.sql"
]

def apply_migrations():
    with engine.connect() as conn:
        with conn.begin():
            for filename in MIGRATION_FILES:
                filepath = os.path.join(MIGRATIONS_DIR, filename)
                print(f"Applying migration: {filename}...")
                with open(filepath, "r", encoding="utf-8") as f:
                    sql = f.read()
                
                # Execute the raw SQL
                conn.execute(text(sql))
                print(f"Successfully applied {filename}")
            
    print("All Phase 10C.1 migrations applied successfully.")

if __name__ == "__main__":
    apply_migrations()
