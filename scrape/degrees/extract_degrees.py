import os
import csv
from bs4 import BeautifulSoup

# Define the path to the folder containing the .txt files and the output CSV file
txt_folder = 'degrees/'  # Update this path if necessary
output_csv = 'final_data/degrees_data.csv'

# List to hold all degree data
degree_data = []

# Read all .txt files in the specified folder
for filename in os.listdir(txt_folder):
    if filename.endswith('.txt'):
        with open(os.path.join(txt_folder, filename), 'r', encoding='utf-8') as file:
            content = file.read()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Find the table in the HTML
            table = soup.find('table', class_='DeAcGridView')
            if table:
                # Iterate through each row in the table body
                for row in table.find('tbody').find_all('tr'):
                    columns = row.find_all('td')
                    if len(columns) == 4:  # Ensure there are enough columns
                        degree_code = columns[0].text.strip()
                        name = columns[1].text.strip()
                        start_term = columns[2].text.strip()
                        degree_id = columns[3].find('a')['href'].split('degreeID=')[1]  # Extract ID from the link

                        # Append the extracted data to the list
                        degree_data.append({
                            'Degree Code': degree_code,
                            'Name': name,
                            'ID': degree_id,
                            'Start Term': start_term
                        })

# Write the collected data to a CSV file
with open(output_csv, 'w', newline='', encoding='utf-8') as csv_file:
    fieldnames = ['Degree Code', 'Name', 'ID', 'Start Term']
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

    writer.writeheader()
    for degree in degree_data:
        writer.writerow(degree)

print(f"Degree data has been written to {output_csv}")