import requests
from bs4 import BeautifulSoup
import csv

# Function to read degree IDs from a file
def read_degree_ids(file_path):
    with open(file_path, 'r') as file:
        return [line.strip() for line in file if line.strip()]

# Read the request headers from the request.txt file
def read_request_headers(file_path):
    headers = {}
    with open(file_path, 'r') as file:
        for line in file:
            if line.strip() and not line.startswith('GET'):
                key, value = line.split(':', 1)
                headers[key.strip()] = value.strip()
    return headers

# Define the base URL and the path to the degree IDs and request headers
base_url = 'http://dn.rutgers.edu/DN/Audit/DegreeAudit.aspx'  # Update this if necessary
degree_ids_file = 'requirements/degree_ids.txt'  # File containing degree IDs
request_headers_file = 'requirements/request.txt'  # File containing request headers

# Read degree IDs and request headers
degree_ids = read_degree_ids(degree_ids_file)
headers = read_request_headers(request_headers_file)

# Initialize lists to hold extracted data
requirements_data = []
conditions_data = []
reuse_data = []

# Loop through each degree ID and perform the GET request
for degree_id in degree_ids:
    # Construct the full URL with the degree ID
    url = f"{base_url}?pageid=audit&degreeID={degree_id}"
    
    # Send the GET request
    response = requests.get(url, headers=headers)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the HTML content
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract requirements
        requirements_section = soup.find(id='ctl00_mainContent_ctl13_panVizRequirements')
        if requirements_section:
            for requirement in requirements_section.find_all('tr', class_='ReportGridItemA'):
                title = requirement.find('H2')
                if title:
                    requirement_info = {
                        'Title': title.get_text(strip=True),
                        'Link': title.find('a')['href'] if title.find('a') else None
                    }
                    requirements_data.append(requirement_info)

        # Extract conditions
        conditions_section = soup.find(id='ctl00_mainContent_ctl13_panNonVisualRequirements')
        if conditions_section:
            for condition in conditions_section.find_all('tr'):
                condition_title = condition.find('H2')
                if condition_title:
                    condition_info = {
                        'Title': condition_title.get_text(strip=True),
                        'Link': condition_title.find('a')['href'] if condition_title.find('a') else None
                    }
                    conditions_data.append(condition_info)

        # Extract reuse information
        reuse_section = soup.find(id='ctl00_mainContent_ctl13_panReuse')
        if reuse_section:
            for reuse in reuse_section.find_all('tr'):
                reuse_title = reuse.find('H2')
                if reuse_title:
                    reuse_info = {
                        'Title': reuse_title.get_text(strip=True),
                        'Link': reuse_title.find('a')['href'] if reuse_title.find('a') else None
                    }
                    reuse_data.append(reuse_info)

    else:
        print(f"Failed to retrieve data for degreeID {degree_id}. Status code: {response.status_code}")

# Write the extracted data to CSV files
with open('requirements_data.csv', 'w', newline='', encoding='utf-8') as csv_file:
    fieldnames = ['Title', 'Link']
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
    writer.writeheader()
    for req in requirements_data:
        writer.writerow(req)

with open('conditions_data.csv', 'w', newline='', encoding='utf-8') as csv_file:
    fieldnames = ['Title', 'Link']
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
    writer.writeheader()
    for cond in conditions_data:
        writer.writerow(cond)

with open('reuse_data.csv', 'w', newline='', encoding='utf-8') as csv_file:
    fieldnames = ['Title', 'Link']
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
    writer.writeheader()
    for reuse in reuse_data:
        writer.writerow(reuse)

print("Data extraction completed and saved to CSV files.") 