import requests
from bs4 import BeautifulSoup
import json

def get_wikipedia_infobox_html(title):
    url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Error fetching page: {url}")
        return None, None
    soup = BeautifulSoup(response.text, 'html.parser')
    infobox = soup.find("table", class_="infobox")
    return infobox, soup

def extract_infobox_field(infobox, label):
    results = []
    for row in infobox.find_all("tr"):
        header = row.find("th")
        if header and label.lower() in header.get_text(strip=True).lower():
            data = row.find("td")
            if data:
                lines = []
                for content in data.contents:
                    if content.name == 'br':
                        lines.append('\n')
                    elif hasattr(content, 'get_text'):
                        lines.append(content.get_text())
                    else:
                        lines.append(str(content))
                full_text = ''.join(lines)
                results = [entry.strip() for entry in full_text.split('\n') if entry.strip()]
                break
    return results

def group_name_roles(flat_list):
    grouped = []
    i = 0
    while i < len(flat_list):
        name = flat_list[i]
        role = None
        if i + 1 < len(flat_list) and flat_list[i + 1].startswith("("):
            role = flat_list[i + 1].strip("()")
            i += 2
        else:
            i += 1
        grouped.append({
            "name": name,
            "role": role if role else "Unknown"
        })
    return grouped

def extract_board_members(soup):
    headers = soup.find_all(["h2", "h3"])
    for header in headers:
        if 'board of directors' in header.get_text(strip=True).lower():
            content = []
            sibling = header.find_next_sibling()
            while sibling and sibling.name not in ['h2', 'h3']:
                # Extract lines of board members
                lines = sibling.get_text(separator="\n").split('\n')
                for line in lines:
                    if line.strip():
                        if '-' in line:
                            parts = line.split('-', 1)
                            name = parts[0].strip()
                            role = parts[1].strip()
                            content.append({"name": name, "role": role})
                        else:
                            content.append({"name": line.strip(), "role": ""})
                sibling = sibling.find_next_sibling()
            return content
    return []

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

def crawl_company(title):
    infobox, soup = get_wikipedia_infobox_html(title)
    if not infobox:
        return {"error": "Infobox not found"}

    raw_key_people = extract_infobox_field(infobox, "Key people")
    key_people = group_name_roles(raw_key_people)
    subsidiaries = extract_infobox_field(infobox, "Subsidiaries")
    board_members_wiki = extract_board_members(soup)
    board_members_tcs = scrape_tcs_leadership_clean()

    return {
        "company": title,
        "employees_key_people": key_people,
        "subsidiaries": subsidiaries,
        "board_members_wikipedia": board_members_wiki,
        "board_members_tcs_official": board_members_tcs
    }

if __name__ == "__main__":
    data = crawl_company("Tata Consultancy Services")
    print(json.dumps(data, indent=2))
