import os
import json

# Define the path to the folder containing the JSON files
input_folder = 'scrape/dataFall25/'  # Update this path if necessary
output_file = 'data/combined_courses.json'  # Output file name

# Initialize a list to hold all course data
combined_data = []

# Iterate through all files in the specified folder
for filename in os.listdir(input_folder):
    print(f"Processing file: {filename}")  # Print the name of the file being processed
    if filename.endswith('.json'):
        file_path = os.path.join(input_folder, filename)
        with open(file_path, 'r') as file:
            try:
                # Load the JSON data from the file
                data = json.load(file)
                # Append the course offerings to the combined data list
                combined_data.extend(data.get('courseOfferings', []))
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON from file {filename}: {e}")

# Write the combined data to a single JSON file
with open(output_file, 'w', encoding='utf-8') as outfile:
    json.dump({'courseOfferings': combined_data}, outfile, ensure_ascii=False, indent=4)

print(f"Combined JSON data has been written to {output_file}.")