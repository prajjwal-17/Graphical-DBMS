from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json
import time

def setup_driver(headless=True):
    """Setup Chrome driver with options"""
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    return driver

def get_wikipedia_infobox_selenium(title, driver):
    """Extract Wikipedia infobox using Selenium"""
    url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "infobox"))
        )
        infobox = driver.find_element(By.CLASS_NAME, "infobox")
        return infobox
    except (TimeoutException, NoSuchElementException):
        print(f"Error: Infobox not found on {url}")
        return None

def extract_infobox_field_selenium(infobox, label):
    """Extract specific field from infobox using Selenium"""
    results = []
    try:
        rows = infobox.find_elements(By.TAG_NAME, "tr")
        for row in rows:
            try:
                header = row.find_element(By.TAG_NAME, "th")
                if label.lower() in header.text.lower():
                    data = row.find_element(By.TAG_NAME, "td")
                    # Get text and split by newlines to handle multiple entries
                    full_text = data.text
                    results = [entry.strip() for entry in full_text.split('\n') if entry.strip()]
                    break
            except NoSuchElementException:
                continue
    except Exception as e:
        print(f"Error extracting field '{label}': {e}")
    return results

def group_name_roles(flat_list):
    """Group names with their roles"""
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

def extract_board_members_selenium(driver):
    """Extract board members from Wikipedia page using Selenium"""
    board_members = []
    try:
        # Look for board of directors section
        headers = driver.find_elements(By.CSS_SELECTOR, "h2, h3")
        for header in headers:
            if 'board of directors' in header.text.lower():
                # Get the next sibling elements until we hit another header
                content = []
                sibling = driver.execute_script("return arguments[0].nextElementSibling;", header)
                
                while sibling and sibling.tag_name.lower() not in ['h2', 'h3']:
                    text = sibling.text
                    lines = text.split('\n')
                    for line in lines:
                        if line.strip():
                            if '-' in line:
                                parts = line.split('-', 1)
                                name = parts[0].strip()
                                role = parts[1].strip()
                                content.append({"name": name, "role": role})
                            else:
                                content.append({"name": line.strip(), "role": ""})
                    
                    sibling = driver.execute_script("return arguments[0].nextElementSibling;", sibling)
                
                board_members = content
                break
    except Exception as e:
        print(f"Error extracting board members: {e}")
    
    return board_members

def scrape_tcs_leadership_selenium(driver):
    """Scrape TCS leadership page using Selenium"""
    url = "https://www.tcs.com/who-we-are/leadership"
    leadership_data = []
    
    try:
        driver.get(url)
        
        # Wait for the page to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "h2.intro-heading, .leadership-section"))
        )
        
        # Give additional time for dynamic content to load
        time.sleep(3)
        
        # Try multiple selectors for role headings
        role_selectors = [
            "h2.intro-heading",
            ".intro-heading",
            "h2[class*='heading']",
            ".leadership-title"
        ]
        
        roles = []
        for selector in role_selectors:
            try:
                roles = driver.find_elements(By.CSS_SELECTOR, selector)
                if roles:
                    print(f"Found {len(roles)} roles using selector: {selector}")
                    break
            except:
                continue
        
        if not roles:
            # Fallback: try to find any leadership-related content
            print("Trying fallback method...")
            leadership_elements = driver.find_elements(By.CSS_SELECTOR, "*[class*='leadership'], *[class*='executive']")
            print(f"Found {len(leadership_elements)} leadership elements")
        
        for role_tag in roles:
            try:
                role = role_tag.text.strip()
                
                # Look for name in various ways
                name_tag = None
                name_selectors = [
                    "h3.intro-description",
                    ".intro-description", 
                    "h3",
                    ".leader-name"
                ]
                
                for selector in name_selectors:
                    try:
                        name_tag = role_tag.find_element(By.XPATH, f"following-sibling::{selector.replace('.', '[contains(@class, \"').replace('h3', 'h3').replace('[contains(@class, \"', '[contains(@class, \"') + '\")]' if '.' in selector else selector}")
                        if name_tag:
                            break
                    except:
                        continue
                
                if name_tag:
                    name_text = name_tag.text
                    
                    # Clean up the name
                    if 'Read more about' in name_text:
                        name = name_text.split('Read more about')[0].strip()
                    else:
                        # Try to extract just the name part
                        lines = name_text.split('\n')
                        name = lines[0].strip()
                    
                    # Filter out non-person entries
                    if len(name) > 60:  # too long to be a name
                        continue
                    if any(word in name.lower() for word in ['positioned', 'growth', 'benchmark', 'strategy', 'risk']):
                        continue
                    
                    leadership_data.append({"name": name, "role": role})
                    
            except Exception as e:
                print(f"Error processing role element: {e}")
                continue
        
        # If no data found, try alternative approach
        if not leadership_data:
            print("No leadership data found with primary method, trying alternative...")
            try:
                # Look for any text that might contain leadership info
                page_text = driver.find_element(By.TAG_NAME, "body").text
                print("Page loaded successfully, but no structured leadership data found")
                print("Page title:", driver.title)
            except Exception as e:
                print(f"Error with alternative approach: {e}")
    
    except TimeoutException:
        print("Timeout waiting for TCS leadership page to load")
    except Exception as e:
        print(f"Error scraping TCS leadership: {e}")
    
    return leadership_data

def crawl_company_selenium(title):
    """Main function to crawl company data using Selenium"""
    driver = setup_driver(headless=False)  # Set to True for headless mode
    
    try:
        # Get Wikipedia data
        infobox = get_wikipedia_infobox_selenium(title, driver)
        if not infobox:
            return {"error": "Infobox not found"}
        
        raw_key_people = extract_infobox_field_selenium(infobox, "Key people")
        key_people = group_name_roles(raw_key_people)
        subsidiaries = extract_infobox_field_selenium(infobox, "Subsidiaries")
        board_members_wiki = extract_board_members_selenium(driver)
        
        # Get TCS official data
        board_members_tcs = scrape_tcs_leadership_selenium(driver)
        
        return {
            "company": title,
            "employees_key_people": key_people,
            "subsidiaries": subsidiaries,
            "board_members_wikipedia": board_members_wiki,
            "board_members_tcs_official": board_members_tcs
        }
    
    finally:
        driver.quit()

def main():
    """Main execution function"""
    try:
        data = crawl_company_selenium("Tata Consultancy Services")
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error in main execution: {e}")

if __name__ == "__main__":
    main()