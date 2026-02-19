import requests

response = requests.get('http://localhost:8000/api/v1/simple-chat/messages/697f0423ea766bc70c53a5d3/697f0423ea766bc70c53a5d4')
data = response.json()

print("Últimos mensajes:")
for msg in data.get('messages', []):
    if 'debug-test' in msg.get('message', ''):
        print('Mensaje debug encontrado:')
        print(f'Message: {msg.get("message")}')
        print(f'File URL: {msg.get("file_url")}')
        print(f'File Name: {msg.get("file_name")}')
        print(f'File Type: {msg.get("file_type")}')
        print(f'File Size: {msg.get("file_size")}')
        print('---')
        break
else:
    print("No se encontró el mensaje debug")
    
print("Todos los mensajes (últimos 3):")
for i, msg in enumerate(data.get('messages', [])[-3:]):
    print(f"{i+1}. {msg.get('message', 'N/A')}")
    print(f"   File URL: {msg.get('file_url', 'N/A')}")
    print(f"   File Name: {msg.get('file_name', 'N/A')}")
    print(f"   File Size: {msg.get('file_size', 'N/A')}")
