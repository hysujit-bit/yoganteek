import psycopg2

DB_URL = 'postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

with open('D:/SUJIT/PROJETCS/yoganteek/create_leads_table.sql', 'r') as f:
    sql = f.read()

cur.execute(sql)
conn.commit()

cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position;", ('leads',))
columns = cur.fetchall()
print('Table "leads" created successfully!')
print('Columns:')
for col in columns:
    print(f'  - {col[0]} ({col[1]})')

cur.close()
conn.close()
