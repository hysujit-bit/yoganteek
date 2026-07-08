import urllib.request, json

data = json.dumps({
    'name': 'Live Test',
    'email': 'live@test.com',
    'phone': '9876543210',
    'health_goal': 'weight',
    'concern': 'pcos-pcod',
    'message': 'Testing live deployment'
}).encode()

req = urllib.request.Request('https://yoganteek-api.onrender.com/api/leads', data=data, headers={'Content-Type': 'application/json'})
r = urllib.request.urlopen(req)
result = json.loads(r.read())
print('Insert result:', result)

r2 = urllib.request.urlopen('https://yoganteek-api.onrender.com/api/leads')
leads = json.loads(r2.read())
print('Total leads:', leads['count'])
for l in leads['leads']:
    print('  ID:', l['id'], '|', l['name'], '|', l['email'], '|', l['created_at'])
