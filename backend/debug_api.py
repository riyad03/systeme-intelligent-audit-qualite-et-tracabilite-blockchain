import requests

url = "http://localhost:8000/test_upload"
files = {'file': ('sample_data.csv', open('../sample_data.csv', 'rb'), 'text/csv')}

try:
    print(f"Testing {url}...")
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

url_analyze = "http://localhost:8000/upload_and_analyze"
files_analyze = {'file': ('sample_data.csv', open('../sample_data.csv', 'rb'), 'text/csv')}

try:
    print(f"\nTesting {url_analyze}...")
    response = requests.post(url_analyze, files=files_analyze)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Analyze Error: {e}")
