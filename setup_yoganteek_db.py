import psycopg2

# Yoganteek database connection
YOGANTEEK_DB_URL = 'postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/Yoganteek?sslmode=require'

conn = psycopg2.connect(YOGANTEEK_DB_URL)
cur = conn.cursor()

# Check existing tables
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
tables = cur.fetchall()
print('Existing tables in Yoganteek DB:')
for t in tables:
    print(f'  - {t[0]}')

# Create leads table
with open('D:/SUJIT/PROJETCS/yoganteek/create_leads_table.sql', 'r') as f:
    sql = f.read()

cur.execute(sql)
conn.commit()
print('\nLeads table created in Yoganteek DB!')

# Verify
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position")
cols = cur.fetchall()
print('Leads table columns:')
for c in cols:
    print(f'  {c[0]} ({c[1]})')

cur.close()
conn.close()
