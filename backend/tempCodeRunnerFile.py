import requests
from bs4 import BeautifulSoup
import json

def scrape_tcs_leadership_clean():
    url = "https://www.tcs.com/who-we-are/leadership"
    response = requests.get(url)
    if response.status_code != 200:
        print("Failed to fetch leadership page")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    leadership_data = []

    roles = soup.find_all('h2', class_='intro-heading')
    for role_tag in roles:
        role = role_tag.get_text(strip=True)
        
        name_tag = role_tag.find_next_sibling('h3', class_='intro-description')
        if name_tag:
            # Extract only the first text node or first line for the name
            # Option 1: get text before first <p> tag
            p_tag = name_tag.find('p')
            if p_tag:
                # Take text before <p>
                name = name_tag.text.split(p_tag.text)[0].strip()
            else:
                # If no <p>, take just first line before \n or full text stripped
                name = name_tag.get_text(separator='\n', strip=True).split('\n')[0]

            # Remove trailing "Read more about ..." if present
            if 'Read more about' in name:
                name = name.split('Read more about')[0].strip()

            leadership_data.append({"name": name, "role": role})

    return leadership_data

if __name__ == "__main__":
    board_members = scrape_tcs_leadership_clean()
    print(json.dumps(board_members, indent=2))
