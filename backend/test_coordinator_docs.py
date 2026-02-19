import requests

response = requests.get('http://localhost:8000/api/v1/simple-chat/coordinator-documents/697f0423ea766bc70c53a5d3')
print('Status:', response.status_code)
data = response.json()
print('Documentos encontrados:', data.get('total_documents', 0))
print('Documentos:')
for doc in data.get('documents', [])[:5]:
    print(f'- {doc.get("file_name", "N/A")} de {doc.get("sender_name", "N/A")}')
