import sqlite3

def get_db_info():
    conn = sqlite3.connect('.codegraph/codegraph.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"Table: {table}, Count: {count}")

get_db_info()
