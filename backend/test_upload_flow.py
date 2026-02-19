import requests
import json
import mimetypes

# 1. Probar upload de archivo
print("🧪 Probando upload de archivo...")
file_path = 'uploads/chat/test-document.txt'

# Verificar el tipo de archivo
mime_type, _ = mimetypes.guess_type(file_path)
print(f"📄 Tipo MIME detectado: {mime_type}")

with open(file_path, 'rb') as f:
    files = {'file': (f.name, f, mime_type)}
    data = {'chat_room': 'test_room'}

    response = requests.post("http://localhost:8000/api/v1/simple-chat/upload", files=files, data=data)
    print(f"Upload Status: {response.status_code}")
    print(f"Upload Response: {response.json()}")

    if response.status_code == 200:
        upload_data = response.json()
        file_url = upload_data['file_url']
        file_name = upload_data['original_filename']
        file_type = upload_data['content_type']
        file_size = upload_data['size']
        
        print(f"\n📎 Archivo subido: {file_name}")
        print(f"🔗 URL: {file_url}")
        
        # 2. Probar envío de mensaje con archivo
        print("\n🧪 Probando envío de mensaje con archivo...")
        message_data = {
            "sender_id": "697f0423ea766bc70c53a5d3",
            "receiver_id": "697f0423ea766bc70c53a5d4",
            "sender_name": "Test User",
            "sender_role": "coordinator",
            "message": f"📎 {file_name}",
            "file_url": file_url,
            "file_name": file_name,
            "file_type": file_type,
            "file_size": file_size
        }
        
        response = requests.post("http://localhost:8000/api/v1/simple-chat/send-message", json=message_data)
        print(f"Message Status: {response.status_code}")
        print(f"Message Response: {response.json()}")
        
        # 3. Probar descarga
        print("\n🧪 Probando descarga...")
        filename = file_url.split('/')[-1]
        download_url = f"http://localhost:8000/api/v1/simple-chat/download/{filename}"
        
        response = requests.get(download_url)
        print(f"Download Status: {response.status_code}")
        print(f"Download Size: {len(response.content)} bytes")
        
        if response.status_code == 200:
            print("✅ Flujo completo funcionando!")
        else:
            print("❌ Error en descarga")
