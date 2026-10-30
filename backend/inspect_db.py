import sqlite3

connection = sqlite3.connect("oneagent.db")
tables = connection.execute(
    "SELECT name FROM sqlite_master "
    "WHERE type='table' AND name NOT LIKE 'sqlite_%'"
).fetchall()

print("TABLES AND ROW COUNTS:")

for (table_name,) in tables:
    columns = connection.execute(
        f'PRAGMA table_info("{table_name}")'
    ).fetchall()

    count = connection.execute(
        f'SELECT COUNT(*) FROM "{table_name}"'
    ).fetchone()[0]

    print(f"\nTable: {table_name}")
    print("Columns:", [column[1] for column in columns])
    print("Rows:", count)

connection.close()
