import psycopg2

DB_URL = 'postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/Yoganteek?sslmode=require'

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()
cur.execute("DELETE FROM leads WHERE email IN ('live@test.com', 'test@example.com')")
conn.commit()
print('Test data cleaned. Remaining leads:')
cur.execute('SELECT id, name, email FROM leads')
for r in cur.fetchall():
    print('  ID:', r[0], '|', r[1], '|', r[2])
cur.close()
conn.close()
