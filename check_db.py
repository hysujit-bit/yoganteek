import psycopg2

DB_URL = 'postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/Yoganteek?sslmode=require'

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

# Check tables
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
tables = cur.fetchall()
print('Tables in your database:')
for t in tables:
    print(f'  - {t[0]}')

# Check leads columns
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position")
cols = cur.fetchall()
print(f'\nLeads table columns ({len(cols)}):')
for c in cols:
    print(f'  {c[0]} ({c[1]})')

# Count rows
cur.execute('SELECT COUNT(*) FROM leads')
count = cur.fetchone()[0]
print(f'\nTotal leads: {count}')

if count > 0:
    cur.execute('SELECT id, name, email, phone, health_goal, concern, created_at FROM leads ORDER BY created_at DESC LIMIT 5')
    rows = cur.fetchall()
    print('\nRecent leads:')
    for r in rows:
        print(f'  ID:{r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]}')

cur.close()
conn.close()
