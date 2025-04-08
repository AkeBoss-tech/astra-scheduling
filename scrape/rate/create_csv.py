import os
import json
import csv

# Define the path to the rate folder and the output CSV file
rate_folder = 'rate'
output_csv = 'final_data/teachers_data.csv'

# List to hold all teacher data
all_teachers = []

# Read all JSON files in the rate folder
for filename in os.listdir(rate_folder):
    if filename.endswith('.json'):
        with open(os.path.join(rate_folder, filename), 'r') as json_file:
            data = json.load(json_file)
            # Extract important variables from each teacher
            for teacher in data.get('data', {}).get('search', {}).get('teachers', {}).get('edges', []):
                node = teacher.get('node', {})
                teacher_info = {
                    'id': node.get('id'),
                    'firstName': node.get('firstName'),
                    'lastName': node.get('lastName'),
                    'avgDifficulty': node.get('avgDifficulty'),
                    'avgRating': node.get('avgRating'),
                    'department': node.get('department'),
                    'numRatings': node.get('numRatings'),
                    'wouldTakeAgainPercent': node.get('wouldTakeAgainPercent'),
                }
                all_teachers.append(teacher_info)

# Write the collected data to a CSV file
with open(output_csv, 'w', newline='') as csv_file:
    fieldnames = ['id', 'firstName', 'lastName', 'avgDifficulty', 'avgRating', 'department', 'numRatings', 'wouldTakeAgainPercent']
    writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

    writer.writeheader()
    for teacher in all_teachers:
        writer.writerow(teacher)

print(f"Data has been written to {output_csv}")