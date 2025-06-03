from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json
import time
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_driver(headless=True):
    """Setup Chrome driver with options and error handling"""
    try:
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
        logger.info("Chrome driver setup successful")
        return driver
    except Exception as e:
        logger.error(f"Failed to setup Chrome driver: {e}")
        raise

def get_wikipedia_page_selenium(title, driver):
    """Navigate to Wikipedia page with error handling"""
    url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
    try:
        logger.info(f"Navigating to Wikipedia URL: {url}")
        driver.get(url)
        
        # Wait for page to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Check if page exists (not a 404 or disambiguation page)
        page_title = driver.title
        logger.info(f"Wikipedia page loaded successfully. Title: {page_title}")
        
        if "does not exist" in page_title.lower() or "404" in page_title:
            logger.error(f"Wikipedia page does not exist: {page_title}")
            return False
            
        return True
        
    except TimeoutException:
        logger.error(f"Timeout while loading Wikipedia page: {url}")
        return False
    except Exception as e:
        logger.error(f"Error loading Wikipedia page: {e}")
        return False

# ==================== WIKIPEDIA INFOBOX FUNCTIONS ====================

def get_wikipedia_infobox_selenium(driver):
    """Extract Wikipedia infobox using Selenium"""
    try:
        logger.info("Searching for Wikipedia infobox...")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "infobox"))
        )
        infobox = driver.find_element(By.CLASS_NAME, "infobox")
        logger.info("Wikipedia infobox found successfully")
        return infobox
    except (TimeoutException, NoSuchElementException):
        logger.error("Wikipedia infobox not found")
        return None

def extract_infobox_field_selenium(infobox, label):
    """Extract specific field from infobox using Selenium"""
    logger.info(f"Extracting infobox field: {label}")
    results = []
    try:
        rows = infobox.find_elements(By.TAG_NAME, "tr")
        logger.info(f"Found {len(rows)} rows in infobox")
        
        for row in rows:
            try:
                header = row.find_element(By.TAG_NAME, "th")
                if label.lower() in header.text.lower():
                    data = row.find_element(By.TAG_NAME, "td")
                    # Get text and split by newlines to handle multiple entries
                    full_text = data.text
                    results = [entry.strip() for entry in full_text.split('\n') if entry.strip()]
                    logger.info(f"Found {len(results)} entries for {label}")
                    break
            except NoSuchElementException:
                continue
    except Exception as e:
        logger.error(f"Error extracting field '{label}': {e}")
    return results

def group_name_roles(flat_list):
    """Group names with their roles"""
    logger.info(f"Grouping {len(flat_list)} items into name-role pairs")
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
    logger.info(f"Created {len(grouped)} name-role pairs")
    return grouped

def extract_board_members_selenium(driver):
    """Extract board members from Wikipedia page using Selenium"""
    logger.info("Searching for board of directors section...")
    board_members = []
    try:
        # Look for board of directors section
        headers = driver.find_elements(By.CSS_SELECTOR, "h2, h3")
        logger.info(f"Found {len(headers)} headers to check")
        
        for header in headers:
            if 'board of directors' in header.text.lower():
                logger.info("Found board of directors section")
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
                logger.info(f"Extracted {len(board_members)} board members from Wikipedia")
                break
    except Exception as e:
        logger.error(f"Error extracting board members from Wikipedia: {e}")
    
    return board_members

# ==================== ACQUISITIONS FUNCTIONS ====================

def find_acquisitions_header(driver):
    """Find the Acquisitions header with multiple strategies"""
    logger.info("Searching for Acquisitions header...")
    
    strategies = [
        (By.ID, "Acquisitions"),
        (By.XPATH, "//span[@id='Acquisitions']"),
        (By.XPATH, "//h2[contains(text(), 'Acquisitions')]"),
        (By.XPATH, "//*[self::h1 or self::h2 or self::h3][contains(text(), 'Acquisitions')]"),
        (By.XPATH, "//*[self::h1 or self::h2 or self::h3][contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'acquisitions')]")
    ]
    
    for i, (by, value) in enumerate(strategies, 1):
        try:
            logger.info(f"Trying acquisitions header strategy {i}")
            element = driver.find_element(by, value)
            logger.info(f"Acquisitions header strategy {i} successful")
            return element
        except NoSuchElementException:
            logger.warning(f"Acquisitions header strategy {i} failed")
            continue
        except Exception as e:
            logger.warning(f"Acquisitions header strategy {i} failed with error: {e}")
            continue
    
    # Final fallback
    try:
        logger.info("Trying final fallback for acquisitions header")
        headers = driver.find_elements(By.CSS_SELECTOR, "h1, h2, h3, h4, h5, h6")
        for header in headers:
            if 'acquisition' in header.text.strip().lower():
                logger.info("Acquisitions header fallback successful")
                return header
    except Exception as e:
        logger.error(f"Acquisitions header final fallback failed: {e}")
    
    logger.error("All strategies to find Acquisitions header failed")
    return None

def find_acquisitions_table(driver, header_element):
    """Find the acquisitions table after the header"""
    logger.info("Searching for acquisitions table...")
    
    if not header_element:
        logger.error("No header element provided for table search")
        return None
    
    try:
        # Get the parent element to traverse siblings properly
        if header_element.tag_name.lower() == 'span':
            parent_header = header_element.find_element(By.XPATH, "./..")
        else:
            parent_header = header_element
        
        # Strategy 1: Look for next table sibling
        try:
            table = parent_header.find_element(By.XPATH, "./following-sibling::table[contains(@class, 'wikitable')]")
            logger.info("Acquisitions table strategy 1 successful")
            return table
        except NoSuchElementException:
            logger.warning("Acquisitions table strategy 1 failed")
        
        # Strategy 2: Look for any table after the header
        try:
            table = parent_header.find_element(By.XPATH, "./following-sibling::*//table[contains(@class, 'wikitable')]")
            logger.info("Acquisitions table strategy 2 successful")
            return table
        except NoSuchElementException:
            logger.warning("Acquisitions table strategy 2 failed")
        
        # Strategy 3: Look for any table with acquisition-related content
        try:
            tables = driver.find_elements(By.CSS_SELECTOR, "table.wikitable")
            logger.info(f"Found {len(tables)} wikitable elements for content search")
            
            for i, table in enumerate(tables):
                table_text = table.text.lower()
                if any(keyword in table_text for keyword in ['acquired', 'acquisition', 'purchase', 'bought']):
                    logger.info(f"Acquisitions table strategy 3 successful (table {i+1})")
                    return table
        except Exception as e:
            logger.warning(f"Acquisitions table strategy 3 failed: {e}")
        
        logger.error("All strategies to find acquisitions table failed")
        return None
        
    except Exception as e:
        logger.error(f"Error finding acquisitions table: {e}")
        return None

def extract_table_data(table, table_type="acquisitions"):
    """Extract data from a table"""
    logger.info(f"Extracting {table_type} table data...")
    
    try:
        # Get headers
        header_elements = table.find_elements(By.CSS_SELECTOR, "tr:first-child th, tr:first-child td")
        headers = []
        
        for header in header_elements:
            header_text = header.text.strip().replace('\n', ' ')
            headers.append(header_text)
            
        logger.info(f"Found {len(headers)} headers for {table_type} table")
        
        if not headers:
            logger.warning(f"No headers found for {table_type} table, using generic column names")
            first_row = table.find_element(By.CSS_SELECTOR, "tr:nth-child(2)")
            cells = first_row.find_elements(By.CSS_SELECTOR, "td, th")
            headers = [f"Column_{i+1}" for i in range(len(cells))]
        
        # Get data rows
        data_rows = table.find_elements(By.CSS_SELECTOR, "tr")[1:]  # Skip header row
        logger.info(f"Found {len(data_rows)} data rows for {table_type} table")
        
        extracted_data = []
        
        for row_idx, row in enumerate(data_rows):
            try:
                cells = row.find_elements(By.CSS_SELECTOR, "td, th")
                if not cells:
                    continue
                
                data = {}
                for i, cell in enumerate(cells):
                    if i >= len(headers):
                        break
                    
                    key = headers[i] if headers[i] else f"Column_{i+1}"
                    value = cell.text.strip()
                    data[key] = value
                
                if data:  # Only add non-empty rows
                    extracted_data.append(data)
                
            except Exception as e:
                logger.warning(f"Error processing {table_type} row {row_idx + 1}: {e}")
                continue
        
        logger.info(f"Successfully extracted {len(extracted_data)} {table_type} records")
        return extracted_data
        
    except Exception as e:
        logger.error(f"Error extracting {table_type} table data: {e}")
        return []

def extract_acquisitions_selenium(driver):
    """Main function to extract acquisitions using Selenium"""
    logger.info("Starting acquisitions extraction...")
    
    try:
        header = find_acquisitions_header(driver)
        if not header:
            return []
        
        table = find_acquisitions_table(driver, header)
        if not table:
            return []
        
        acquisitions = extract_table_data(table, "acquisitions")
        return acquisitions
        
    except Exception as e:
        logger.error(f"Error in acquisitions extraction: {e}")
        return []

# ==================== TCS LEADERSHIP FUNCTIONS ====================

def scrape_tcs_leadership_selenium(driver):
    """Scrape TCS leadership page using Selenium"""
    url = "https://www.tcs.com/who-we-are/leadership"
    logger.info(f"Navigating to TCS leadership page: {url}")
    leadership_data = []
    
    try:
        driver.get(url)
        
        # Wait for the page to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "h2.intro-heading, .leadership-section"))
        )
        
        # Give additional time for dynamic content to load
        time.sleep(3)
        logger.info("TCS leadership page loaded successfully")
        
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
                    logger.info(f"Found {len(roles)} roles using selector: {selector}")
                    break
            except:
                continue
        
        if not roles:
            logger.warning("No role elements found, trying fallback method...")
            leadership_elements = driver.find_elements(By.CSS_SELECTOR, "*[class*='leadership'], *[class*='executive']")
            logger.info(f"Found {len(leadership_elements)} leadership elements")
        
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
                        lines = name_text.split('\n')
                        name = lines[0].strip()
                    
                    # Filter out non-person entries
                    if len(name) > 60:  # too long to be a name
                        continue
                    if any(word in name.lower() for word in ['positioned', 'growth', 'benchmark', 'strategy', 'risk']):
                        continue
                    
                    leadership_data.append({"name": name, "role": role})
                    
            except Exception as e:
                logger.warning(f"Error processing TCS role element: {e}")
                continue
        
        logger.info(f"Successfully extracted {len(leadership_data)} TCS leadership records")
        
    except TimeoutException:
        logger.error("Timeout waiting for TCS leadership page to load")
    except Exception as e:
        logger.error(f"Error scraping TCS leadership: {e}")
    
    return leadership_data

# ==================== MAIN COMBINED FUNCTION ====================

def crawl_company_complete_selenium(title):
    """Main function to crawl all company data using Selenium"""
    logger.info(f"=== Starting complete company crawl for: {title} ===")
    
    driver = None
    try:
        # Setup driver
        driver = setup_driver(headless=False)  # Set to True for headless mode
        
        # Navigate to Wikipedia page
        if not get_wikipedia_page_selenium(title, driver):
            return {"error": "Could not load Wikipedia page", "company": title}
        
        # Get Wikipedia infobox data
        infobox = get_wikipedia_infobox_selenium(driver)
        if infobox:
            raw_key_people = extract_infobox_field_selenium(infobox, "Key people")
            key_people = group_name_roles(raw_key_people)
            subsidiaries = extract_infobox_field_selenium(infobox, "Subsidiaries")
            board_members_wiki = extract_board_members_selenium(driver)
        else:
            logger.warning("No infobox found, setting empty values")
            key_people = []
            subsidiaries = []
            board_members_wiki = []
        
        # Get acquisitions data
        acquisitions = extract_acquisitions_selenium(driver)
        
        # Get TCS official leadership data
        board_members_tcs = scrape_tcs_leadership_selenium(driver)
        
        # Compile results
        result = {
            "company": title,
            "employees_key_people": key_people,
            "subsidiaries": subsidiaries,
            "board_members_wikipedia": board_members_wiki,
            "board_members_tcs_official": board_members_tcs,
            "acquisitions": acquisitions,
            "summary": {
                "key_people_count": len(key_people),
                "subsidiaries_count": len(subsidiaries),
                "board_members_wiki_count": len(board_members_wiki),
                "board_members_tcs_count": len(board_members_tcs),
                "acquisitions_count": len(acquisitions)
            }
        }
        
        logger.info(f"=== Crawl completed successfully ===")
        logger.info(f"Summary: {result['summary']}")
        return result
        
    except Exception as e:
        logger.error(f"Error in main crawl function: {e}")
        return {"error": str(e), "company": title}
        
    finally:
        if driver:
            try:
                driver.quit()
                logger.info("Driver closed successfully")
            except Exception as e:
                logger.error(f"Error closing driver: {e}")

def main():
    """Main execution function with error handling"""
    try:
        logger.info("=== Starting Combined TCS Scraper ===")
        data = crawl_company_complete_selenium("Tata Consultancy Services")
        print(json.dumps(data, indent=2))
        logger.info("=== Scraping completed successfully ===")
        
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}")
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2))

if __name__ == "__main__":
    main()