# fetch_courses.py

import os
import requests
import time  # Importing the time module

# Read the subject codes from dropdown_values.txt
with open('dropdown_values.txt', 'r') as file:
    subject_codes = [line.strip() for line in file.readlines()]

# Create a data directory if it doesn't exist
os.makedirs('data', exist_ok=True)

# Read the curl command from curl.txt
with open('curl.txt', 'r') as file:
    curl_command = file.read()

# Parse the curl command to extract necessary details
lines = curl_command.splitlines()
method, url = lines[0].split(' ', 2)[:2]  # Extract method and URL
headers = {}
for line in lines[1:]:
    if line.startswith('Host:'):
        continue  # Skip Host header as it's included in the URL
    if line.strip():  # Only process non-empty lines
        key, value = line.split(': ', 1)
        headers[key] = value

# Loop through each subject code and execute the modified request
for subject_code in subject_codes:
    # Replace the subject code in the URL
    modified_url = url.replace('subject=011', f'subject={subject_code}')
    
    # Define the output file path
    output_file = f'dataFall25/courses_{subject_code}.json'
    
    # Check if the output file already exists
    if os.path.exists(output_file):
        print(f"Data for subject {subject_code} already exists. Skipping...")
        continue  # Skip to the next subject code if the file exists

    # Make the HTTP request
    response = requests.request(method, "https://sims.rutgers.edu/" + modified_url, headers=headers)

    # Save the response to the specified file
    with open(output_file, 'w') as outfile:
        outfile.write(response.text)

    print(f"Data for subject {subject_code} saved to {output_file}")
    
    # Add a 30-second delay between scrapes
    time.sleep(15)