import os
import csv
import json
from bs4 import BeautifulSoup

# Function to extract data from the HTML content
def extract_data(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')

    # Initialize lists to hold extracted data
    extracted_data = []

    # Extract relevant information from the HTML
    # Assuming the data is in a table format
    table = soup.find('table', class_='DeAcGridView')
    if table:
        for row in table.find('tbody').find_all('tr'):
            columns = row.find_all('td')
            if len(columns) >= 3:  # Ensure there are enough columns
                degree_code = columns[0].text.strip()
                name = columns[1].text.strip()
                start_term = columns[2].text.strip()
                degree_id = columns[3].find('a')['href'].split('degreeID=')[1] if columns[3].find('a') else None

                # Append the extracted data to the list
                extracted_data.append({
                    'Degree Code': degree_code,
                    'Name': name,
                    'Start Term': start_term,
                    'Degree ID': degree_id
                })

    return extracted_data

# Function to save extracted data to a CSV file
def save_to_csv(data, output_file):
    with open(output_file, 'w', newline='', encoding='utf-8') as csv_file:
        fieldnames = ['Degree Code', 'Name', 'Start Term', 'Degree ID']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for item in data:
            writer.writerow(item)

# Function to save extracted data to a JSON file
def save_to_json(data, output_file):
    with open(output_file, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

# Main function
def main():
    # Define the path to the HTML file
    html_file_path = 'requirements/response.txt'  # Update this path if necessary

    # Read the HTML content from the file
    with open(html_file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()

    # Extract data from the HTML content
    extracted_data = extract_data(html_content)

    # Save the extracted data to CSV and JSON files
    save_to_csv(extracted_data, 'extracted_data.csv')
    save_to_json(extracted_data, 'extracted_data.json')

    print("Data extraction completed and saved to extracted_data.csv and extracted_data.json.")

if __name__ == '__main__':
    main() 