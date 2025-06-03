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
        logger.info(f"Navigating to URL: {url}")
        driver.get(url)
        
        # Wait for page to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Check if page exists (not a 404 or disambiguation page)
        page_title = driver.title
        logger.info(f"Page loaded successfully. Title: {page_title}")
        
        if "does not exist" in page_title.lower() or "404" in page_title:
            logger.error(f"Page does not exist: {page_title}")
            return False
            
        return True
        
    except TimeoutException:
        logger.error(f"Timeout while loading page: {url}")
        return False
    except Exception as e:
        logger.error(f"Error loading Wikipedia page: {e}")
        return False

def find_acquisitions_header(driver):
    """Find the Acquisitions header with multiple strategies"""
    logger.info("Searching for Acquisitions header...")
    
    strategies = [
        # Strategy 1: Direct ID lookup
        (By.ID, "Acquisitions"),
        # Strategy 2: XPath for span with id="Acquisitions"
        (By.XPATH, "//span[@id='Acquisitions']"),
        # Strategy 3: H2 containing "Acquisitions"
        (By.XPATH, "//h2[contains(text(), 'Acquisitions')]"),
        # Strategy 4: Any header with "Acquisitions"
        (By.XPATH, "//*[self::h1 or self::h2 or self::h3][contains(text(), 'Acquisitions')]"),
        # Strategy 5: Case insensitive search
        (By.XPATH, "//*[self::h1 or self::h2 or self::h3][contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'acquisitions')]")
    ]
    
    for i, (by, value) in enumerate(strategies, 1):
        try:
            logger.info(f"Trying strategy {i}: {by} = {value}")
            element = driver.find_element(by, value)
            logger.info(f"Strategy {i} successful: Found element with text '{element.text.strip()}'")
            return element
        except NoSuchElementException:
            logger.warning(f"Strategy {i} failed: Element not found")
            continue
        except Exception as e:
            logger.warning(f"Strategy {i} failed with error: {e}")
            continue
    
    # Final fallback: search all headers and check text content
    try:
        logger.info("Trying final fallback: searching all headers")
        headers = driver.find_elements(By.CSS_SELECTOR, "h1, h2, h3, h4, h5, h6")
        logger.info(f"Found {len(headers)} total headers")
        
        for header in headers:
            header_text = header.text.strip().lower()
            if 'acquisition' in header_text:
                logger.info(f"Fallback successful: Found header with text '{header.text.strip()}'")
                return header
                
    except Exception as e:
        logger.error(f"Final fallback failed: {e}")
    
    logger.error("All strategies to find Acquisitions header failed")
    return None

def find_acquisitions_table(driver, header_element):
    """Find the acquisitions table after the header"""
    logger.info("Searching for acquisitions table...")
    
    if not header_element:
        logger.error("No header element provided")
        return None
    
    try:
        # Get the parent element to traverse siblings properly
        if header_element.tag_name.lower() == 'span':
            # If it's a span, get the parent h2
            parent_header = header_element.find_element(By.XPATH, "./..")
            logger.info(f"Found parent header: {parent_header.tag_name}")
        else:
            parent_header = header_element
        
        # Strategy 1: Look for next table sibling
        try:
            table = parent_header.find_element(By.XPATH, "./following-sibling::table[contains(@class, 'wikitable')]")
            logger.info("Strategy 1 successful: Found wikitable as sibling")
            return table
        except NoSuchElementException:
            logger.warning("Strategy 1 failed: No wikitable sibling found")
        
        # Strategy 2: Look for any table after the header
        try:
            table = parent_header.find_element(By.XPATH, "./following-sibling::*//table[contains(@class, 'wikitable')]")
            logger.info("Strategy 2 successful: Found wikitable in descendant")
            return table
        except NoSuchElementException:
            logger.warning("Strategy 2 failed: No wikitable descendant found")
        
        # Strategy 3: Look for any table with acquisition-related content
        try:
            tables = driver.find_elements(By.CSS_SELECTOR, "table.wikitable")
            logger.info(f"Strategy 3: Found {len(tables)} wikitable elements")
            
            for i, table in enumerate(tables):
                table_text = table.text.lower()
                if any(keyword in table_text for keyword in ['acquired', 'acquisition', 'purchase', 'bought']):
                    logger.info(f"Strategy 3 successful: Found acquisition-related table {i+1}")
                    return table
                    
        except Exception as e:
            logger.warning(f"Strategy 3 failed: {e}")
        
        logger.error("All strategies to find acquisitions table failed")
        return None
        
    except Exception as e:
        logger.error(f"Error finding acquisitions table: {e}")
        return None

def extract_table_data(table):
    """Extract data from the acquisitions table"""
    logger.info("Extracting table data...")
    
    try:
        # Get headers
        header_elements = table.find_elements(By.CSS_SELECTOR, "tr:first-child th, tr:first-child td")
        headers = []
        
        for header in header_elements:
            header_text = header.text.strip().replace('\n', ' ')
            headers.append(header_text)
            
        logger.info(f"Found {len(headers)} headers: {headers}")
        
        if not headers:
            logger.warning("No headers found, using generic column names")
            # Try to determine number of columns from first data row
            first_row = table.find_element(By.CSS_SELECTOR, "tr:nth-child(2)")
            cells = first_row.find_elements(By.CSS_SELECTOR, "td, th")
            headers = [f"Column_{i+1}" for i in range(len(cells))]
        
        # Get data rows
        data_rows = table.find_elements(By.CSS_SELECTOR, "tr")[1:]  # Skip header row
        logger.info(f"Found {len(data_rows)} data rows")
        
        acquisitions = []
        
        for row_idx, row in enumerate(data_rows):
            try:
                cells = row.find_elements(By.CSS_SELECTOR, "td, th")
                if not cells:
                    logger.warning(f"Row {row_idx + 1}: No cells found, skipping")
                    continue
                
                data = {}
                for i, cell in enumerate(cells):
                    if i >= len(headers):
                        logger.warning(f"Row {row_idx + 1}: More cells than headers, truncating")
                        break
                    
                    key = headers[i] if headers[i] else f"Column_{i+1}"
                    value = cell.text.strip()
                    data[key] = value
                
                if data:  # Only add non-empty rows
                    acquisitions.append(data)
                    logger.debug(f"Row {row_idx + 1}: {data}")
                
            except Exception as e:
                logger.warning(f"Error processing row {row_idx + 1}: {e}")
                continue
        
        logger.info(f"Successfully extracted {len(acquisitions)} acquisition records")
        return acquisitions
        
    except Exception as e:
        logger.error(f"Error extracting table data: {e}")
        return []

def extract_acquisitions_selenium(driver):
    """Main function to extract acquisitions using Selenium"""
    logger.info("Starting acquisitions extraction...")
    
    try:
        # Find the acquisitions header
        header = find_acquisitions_header(driver)
        if not header:
            return []
        
        # Find the acquisitions table
        table = find_acquisitions_table(driver, header)
        if not table:
            return []
        
        # Extract table data
        acquisitions = extract_table_data(table)
        return acquisitions
        
    except Exception as e:
        logger.error(f"Error in acquisitions extraction: {e}")
        return []

def crawl_acquisitions_selenium(title):
    """Main function to crawl acquisitions data using Selenium"""
    logger.info(f"Starting to crawl acquisitions for: {title}")
    
    driver = None
    try:
        # Setup driver
        driver = setup_driver(headless=False)  # Set to True for headless mode
        
        # Navigate to Wikipedia page
        if not get_wikipedia_page_selenium(title, driver):
            return {"error": "Could not load Wikipedia page", "company": title}
        
        # Extract acquisitions
        acquisitions = extract_acquisitions_selenium(driver)
        
        if not acquisitions:
            logger.warning("No acquisitions found")
            return {
                "company": title,
                "acquisitions": [],
                "message": "No acquisitions data found on the page"
            }
        
        logger.info(f"Successfully extracted {len(acquisitions)} acquisitions")
        return {
            "company": title,
            "acquisitions": acquisitions
        }
        
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
        logger.info("=== Starting TCS Acquisitions Scraper ===")
        data = crawl_acquisitions_selenium("Tata Consultancy Services")
        print(json.dumps(data, indent=2))
        logger.info("=== Scraping completed ===")
        
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}")
        print(json.dumps({"error": f"Unexpected error: {str(e)}"}, indent=2))

if __name__ == "__main__":
    main()