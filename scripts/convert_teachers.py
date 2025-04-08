import csv
import json
import os

def convert_csv_to_json():
    # Get the absolute path to the data directory
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(current_dir, 'data')
    
    csv_file = os.path.join(data_dir, 'teachers_data.csv')
    json_file = os.path.join(data_dir, 'teachers_data.json')
    
    teachers = []
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        csv_reader = csv.DictReader(f)
        for row in csv_reader:
            # Convert numeric fields
            try:
                row['avgDifficulty'] = float(row['avgDifficulty']) if row['avgDifficulty'] else 0
                row['avgRating'] = float(row['avgRating']) if row['avgRating'] else 0
                row['numRatings'] = int(row['numRatings']) if row['numRatings'] else 0
                row['wouldTakeAgainPercent'] = float(row['wouldTakeAgainPercent']) if row['wouldTakeAgainPercent'] else 0
            except (ValueError, TypeError):
                print(f"Warning: Could not convert numeric fields for row: {row}")
                continue
            
            teachers.append(row)
    
    # Write to JSON file
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(teachers, f, indent=2)
    
    print(f"Converted {len(teachers)} teacher records to JSON")
    print(f"JSON file saved at: {json_file}")

if __name__ == '__main__':
    convert_csv_to_json() 