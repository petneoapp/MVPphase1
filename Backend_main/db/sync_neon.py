import psycopg2
import sys

LOCAL_URL = "postgresql://postgres:dexterslab@localhost:5432/petneoapp"
NEON_URL = "postgresql://neondb_owner:npg_zc8MxCqp7VKX@ep-gentle-feather-ao7hg5ec.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

TRANSACTIONAL_TABLES = [
    # SQLAlchemy child transactional tables
    "prescriptions",
    "appointments",
    "reviews",
    "vaccinations",
    "pets",
    "vet_breaks",
    "vet_availabilities",
    "vet_availability",
    "vet_day_overrides",
    "vet_services",
    "vets",
    "qualifications",
    "user_addresses",
    "user_sessions",
    "user_mobile_otps",
    "device_tokens",
    "email_otps",
    "mobile_otps",
    "sessions",
    # Prisma child transactional tables
    '"AnalyticEvent"',
    '"OrderItem"',
    '"Order"',
    '"BoardingBooking"',
    '"GroomingBooking"',
    '"Subscription"',
    '"Appointment"',
    '"Notification"',
    '"Pet"',
    '"Vet"'
]

MASTER_TABLES = [
    "services",
    "species",
    "breeds",
    "home_content"
]

def main():
    print("Connecting to local database...")
    local_conn = psycopg2.connect(LOCAL_URL)
    local_cur = local_conn.cursor()

    print("Connecting to Neon production database...")
    neon_conn = psycopg2.connect(NEON_URL)
    neon_cur = neon_conn.cursor()

    # Capture Neon user counts before sync
    print("\nAuditing initial Neon 'users' and 'User' table row counts...")
    neon_cur.execute("SELECT COUNT(*) FROM users;")
    neon_users_count = neon_cur.fetchone()[0]
    neon_cur.execute("SELECT COUNT(*) FROM \"User\";")
    neon_user_prisma_count = neon_cur.fetchone()[0]
    print(f" -> Neon 'users' (SQLAlchemy): {neon_users_count} rows")
    print(f" -> Neon 'User' (Prisma): {neon_user_prisma_count} rows")

    try:
        # 1. Truncate Neon transactional tables (excluding users and User)
        print("\n[Step 1] Truncating Neon transactional tables...")
        truncate_query = f"TRUNCATE TABLE {', '.join(TRANSACTIONAL_TABLES)} RESTART IDENTITY CASCADE;"
        neon_cur.execute(truncate_query)
        print(" -> Truncation complete.")

        # 2. Sync Master tables
        print("\n[Step 2] Migrating master seeds from local to Neon...")
        # First truncate master tables on Neon to prevent duplicates and reset ids
        neon_cur.execute("TRUNCATE TABLE services, species, breeds, home_content RESTART IDENTITY CASCADE;")
        
        # - Migrate species
        local_cur.execute("SELECT name FROM species;")
        species_rows = local_cur.fetchall()
        for row in species_rows:
            neon_cur.execute("INSERT INTO species (name) VALUES (%s) ON CONFLICT DO NOTHING;", (row[0],))
        print(f" -> Migrated {len(species_rows)} rows to 'species'")

        # - Migrate services
        local_cur.execute("SELECT id, name FROM services ORDER BY id;")
        services_rows = local_cur.fetchall()
        for row in services_rows:
            neon_cur.execute("INSERT INTO services (id, name) VALUES (%s, %s) ON CONFLICT DO NOTHING;", (row[0], row[1]))
        print(f" -> Migrated {len(services_rows)} rows to 'services'")

        # - Migrate breeds
        local_cur.execute("SELECT id, name, species_name FROM breeds ORDER BY id;")
        breeds_rows = local_cur.fetchall()
        for row in breeds_rows:
            neon_cur.execute("INSERT INTO breeds (id, name, species_name) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING;", (row[0], row[1], row[2]))
        print(f" -> Migrated {len(breeds_rows)} rows to 'breeds'")

        # - Migrate home_content
        # Get column names dynamically
        local_cur.execute("SELECT * FROM home_content LIMIT 0;")
        col_names = [desc[0] for desc in local_cur.description]
        col_list = ", ".join(col_names)
        placeholder_list = ", ".join(["%s"] * len(col_names))
        
        local_cur.execute("SELECT * FROM home_content ORDER BY screen_id;")
        home_content_rows = local_cur.fetchall()
        for row in home_content_rows:
            neon_cur.execute(f"INSERT INTO home_content ({col_list}) VALUES ({placeholder_list}) ON CONFLICT DO NOTHING;", row)
        print(f" -> Migrated {len(home_content_rows)} rows to 'home_content'")

        # Commit Neon transaction
        neon_conn.commit()
        print("\nNeon transaction committed successfully!")

    except Exception as e:
        neon_conn.rollback()
        print("\n[ERROR] Sync failed. Neon transaction rolled back.", file=sys.stderr)
        print(e, file=sys.stderr)
        sys.exit(1)
    finally:
        local_cur.close()
        local_conn.close()

    # 3. Post-Sync Audit Verification
    print("\n================ NEON POST-SYNC VERIFICATION ================")
    neon_cur = neon_conn.cursor()
    
    # Check users / User counts
    neon_cur.execute("SELECT COUNT(*) FROM users;")
    post_users = neon_cur.fetchone()[0]
    neon_cur.execute("SELECT COUNT(*) FROM \"User\";")
    post_user_prisma = neon_cur.fetchone()[0]
    
    print("\n--- ACCOUNT PRESERVATION STATUS ---")
    print(f" - users (SQLAlchemy): Pre={neon_users_count}, Post={post_users} -> {'PASSED' if neon_users_count == post_users else 'FAILED'}")
    print(f" - User (Prisma): Pre={neon_user_prisma_count}, Post={post_user_prisma} -> {'PASSED' if neon_user_prisma_count == post_user_prisma else 'FAILED'}")

    print("\n--- MASTER SEEDS STATUS ---")
    for table in MASTER_TABLES:
        neon_cur.execute(f'SELECT COUNT(*) FROM "{table}"')
        count = neon_cur.fetchone()[0]
        print(f" - {table}: {count} rows")

    print("\n--- TRANSACTIONAL TABLES STATUS ---")
    any_failed = False
    for table in TRANSACTIONAL_TABLES:
        neon_cur.execute(f'SELECT COUNT(*) FROM {table}')
        count = neon_cur.fetchone()[0]
        status = "PASSED" if count == 0 else "FAILED"
        print(f" - {table}: {count} rows -> {status}")
        if count != 0:
            any_failed = True

    print("\n============================================================")
    if not any_failed and post_users == neon_users_count and post_user_prisma == neon_user_prisma_count:
        print("VERIFICATION SUCCESSFUL: NEON DATABASE SYNCED AND AUTH RECORDS PRESERVED.")
    else:
        print("VERIFICATION WARNING: Schema or row count anomalies detected.")

    neon_cur.close()
    neon_conn.close()

if __name__ == "__main__":
    main()
