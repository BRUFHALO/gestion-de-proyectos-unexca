import requests
import json

url = "http://localhost:8000/api/v1/simple-chat/send-message"
data = {
    "sender_id": "697f0423ea766bc70c53a5d3",
    "receiver_id": "697f0423ea766bc70c53a5d4", 
    "sender_name": "Dra. Carmen Lopez",
    "sender_role": "coordinator",
    "message": "Documento PDF de prueba - haz click en el botón de descarga ⬇️",
    "file_url": "http://localhost:8000/uploads/chat/documento-prueba-descarga.pdf",
    "file_name": "documento-prueba-descarga.pdf",
    "file_type": "application/pdf",
    "file_size": 456
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
