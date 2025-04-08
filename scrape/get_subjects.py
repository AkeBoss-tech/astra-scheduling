from bs4 import BeautifulSoup

# Load the HTML content (you can also read from a file)
html_content = ""

with open('courses.html', 'r') as file:
    html_content = file.read()

# Parse the HTML
soup = BeautifulSoup(html_content, 'html.parser')

# Find the select element
select_element = soup.find('select')

# Extract all option values
values = [option['value'] for option in select_element.find_all('option')]

# Save values to a text file
with open('dropdown_values.txt', 'w') as file:
    for value in values:
        file.write(f"{value}\n")

print("Values saved to dropdown_values.txt")
