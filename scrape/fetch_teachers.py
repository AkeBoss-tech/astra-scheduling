import shlex
import json
import requests

# i manually changed the curl command to use the correct cursor in the database
# for some reason you can get 1k results with each request

# Read cURL command from the file
with open("curls/ratemy2.txt", "r") as file:
    curl_text = file.read()

# Preprocess: Remove caret (^) used for multi-line cURL on Windows
curl_text = curl_text.replace("^", "")

# Tokenize the command using shlex (handles quotes properly)
tokens = shlex.split(curl_text)

# Extract URL and method
url = None
headers = {}
cookies = {}
data = None

i = 0
while i < len(tokens):
    token = tokens[i]
    if token.lower() == "curl":
        url = tokens[i + 1]
        i += 1
    elif token == "-H":
        header = tokens[i + 1]
        key, value = header.split(": ", 1)
        headers[key] = value
        i += 1
    elif token == "-b":
        # Cookies are passed in "-b" option
        cookie_string = tokens[i + 1]
        cookies = {c.split("=")[0]: c.split("=")[1] for c in cookie_string.split("; ") if "=" in c}
        i += 1
    elif token == "--data-raw":
        data = tokens[i + 1]
        i += 1
    i += 1

# Convert data to JSON if it's JSON-formatted
if data:
    try:
        data = json.loads(data)
    except json.JSONDecodeError:
        pass

# Send the request
response = requests.post(url, headers=headers, cookies=cookies, json=data)

# Print the response
print(response.status_code)
print(response.json())  # Assuming the response is JSON

# Save the response in the rate folder
with open("rate/response.json", "w") as response_file:
    json.dump(response.json(), response_file)  # Save the JSON response
