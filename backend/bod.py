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
            p_tag = name_tag.find('p')
            if p_tag:
                name = name_tag.text.split(p_tag.text)[0].strip()
            else:
                name = name_tag.get_text(separator='\n', strip=True).split('\n')[0]

            if 'Read more about' in name:
                name = name.split('Read more about')[0].strip()

            # Filter out non-person entries by simple heuristics
            if len(name) > 60:  # too long to be a name
                continue
            if any(word in name.lower() for word in ['positioned', 'growth', 'benchmark', 'strategy', 'risk']):
                continue

            leadership_data.append({"name": name, "role": role})

    return leadership_data


if __name__ == "__main__":
    board_members = scrape_tcs_leadership_clean()
    print(json.dumps(board_members, indent=2))
