import requests
import json

response = requests.get("http://localhost:8000/api/v1/simple-chat/messages/697f0423ea766bc70c53a5d3/697f0423ea766bc70c53a5d4")
data = response.json()

print("Messages:")
for msg in data.get('messages', []):
    print(f"- Message: {msg.get('message', 'N/A')}")
    print(f"  File URL: {msg.get('file_url', 'N/A')}")
    print(f"  File Name: {msg.get('file_name', 'N/A')}")
    print(f"  File Type: {msg.get('file_type', 'N/A')}")
    print(f"  File Size: {msg.get('file_size', 'N/A')}")
    print()
