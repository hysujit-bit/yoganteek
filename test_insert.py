import psycopg2

DB_URL = 'postgresql://neondb_owner:npg_Ma4iLj1dfIAQ@ep-restless-flower-aoqn7s9w-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

# Insert test lead
cur.execute(
    """INSERT INTO leads (name, email, phone, health_goal, concern, message, calendly_url)
       VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
    ('Test User', 'test@example.com', '9876543210', 'weight', 'pcos-pcod', 'Test message', 'https://calendly.com/jspyoga1986/30min?email=test@example.com&name=Test+User')
)
lead_id = cur.fetchone()[0]
conn.commit()
print(f'Lead inserted with ID: {lead_id}')

# Verify
cur.execute("SELECT id, name, email, phone, health_goal, concern FROM leads WHERE id = %s", (lead_id,))
row = cur.fetchone()
print(f'Verified: {row}')

# Cleanup test data
cur.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
conn.commit()
print('Test data cleaned up')

cur.close()
conn.close()
print('All tests passed!')
