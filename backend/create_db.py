import psycopg
from psycopg import sql

def init_db():
    connection_strings = [
        # Try host 127.0.0.1 with postgres/postgres (commonly default)
        "postgresql://postgres:postgres@127.0.0.1:5432/postgres?connect_timeout=3",
        # Try passwordless
        "postgresql://postgres@127.0.0.1:5432/postgres?connect_timeout=3",
        # Try trust on localhost
        "host=127.0.0.1 port=5432 dbname=postgres user=postgres connect_timeout=3",
    ]
    
    conn = None
    for conn_str in connection_strings:
        try:
            print(f"Trying to connect with: {conn_str}")
            conn = psycopg.connect(conn_str, autocommit=True)
            print("Connected successfully!")
            break
        except Exception as e:
            print(f"Failed: {e}")
            
    if conn is None:
        print("Could not connect to PostgreSQL. Please ensure the user/password is correct.")
        return

    try:
        with conn.cursor() as cur:
            # Check if database exists
            cur.execute("SELECT 1 FROM pg_database WHERE datname = 'medlaw_guard'")
            exists = cur.fetchone()
            if not exists:
                print("Database 'medlaw_guard' does not exist. Creating...")
                cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier("medlaw_guard")))
                print("Database 'medlaw_guard' created successfully.")
            else:
                print("Database 'medlaw_guard' already exists.")
        conn.close()
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    init_db()
