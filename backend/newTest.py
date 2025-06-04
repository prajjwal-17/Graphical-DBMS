from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import pandas as pd
import json
import time
import logging
from datetime import datetime
import os

class ROCCompanyCrawler:
    def __init__(self, headless=True):
        self.setup_logging()
        self.driver = None
        self.wait = None
        self.headless = headless
        
        # List of all Indian states and UTs
        self.states = [
            "andaman and nicobar islands", "andhra pradesh", "arunachal pradesh", 
            "assam", "bihar", "chandigarh", "chattisgarh", "dadra & nagar haveli", 
            "daman and diu", "delhi", "goa", "gujarat", "haryana", "himachal pradesh", 
            "jammu & kashmir", "jharkhand", "karnataka", "kerala", "ladakh", 
            "lakshadweep", "madhya pradesh", "maharashtra", "manipur", "meghalaya", 
            "mizoram", "nagaland", "orissa", "pondicherry", "punjab", "rajasthan", 
            "sikkim", "tamil nadu", "telangana", "tripura", "uttar pradesh", 
            "uttarakhand", "west bengal"
        ]
        
        self.base_url = "https://www.data.gov.in/resource/registrars-companies-roc-wise-company-master-data"
        
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('roc_crawler.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def setup_driver(self):
        """Setup Chrome WebDriver with options"""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.wait = WebDriverWait(self.driver, 30)  # Increased timeout
            self.logger.info("Chrome driver initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize Chrome driver: {e}")
            raise
    
    def close_driver(self):
        """Close the WebDriver"""
        if self.driver:
            self.driver.quit()
            self.logger.info("Chrome driver closed")
    
    def navigate_to_page(self):
        """Navigate to the ROC data page"""
        try:
            self.logger.info(f"Navigating to: {self.base_url}")
            self.driver.get(self.base_url)
            
            # Wait for page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            self.logger.info("Page loaded successfully")
            
            # Handle popup if present
            self.handle_popup()
            
            return True
        except TimeoutException:
            self.logger.error("Timeout waiting for page to load")
            return False
        except Exception as e:
            self.logger.error(f"Error navigating to page: {e}")
            return False
    
    def handle_popup(self):
        """Handle any popup messages that appear on the site"""
        try:
            # Look for common popup close buttons
            close_selectors = [
                "button.close",
                ".modal-header .close",
                ".popup-close",
                "button[data-dismiss='modal']",
                ".close-button",
                "//button[contains(text(), '×')]",
                "//button[contains(text(), 'Close')]",
                "//span[contains(text(), '×')]",
                ".modal .close"
            ]
            
            for selector in close_selectors:
                try:
                    if selector.startswith("//"):
                        close_button = self.driver.find_elements(By.XPATH, selector)
                    else:
                        close_button = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    if close_button and close_button[0].is_displayed():
                        close_button[0].click()
                        self.logger.info(f"Closed popup using selector: {selector}")
                        time.sleep(1)
                        return True
                except Exception:
                    continue
            
            # Check for modal backdrop and click it
            try:
                modal_backdrop = self.driver.find_elements(By.CSS_SELECTOR, ".modal-backdrop")
                if modal_backdrop:
                    # Press Escape key to close modal
                    from selenium.webdriver.common.keys import Keys
                    self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                    self.logger.info("Closed popup using Escape key")
                    time.sleep(1)
                    return True
            except Exception:
                pass
            
            return False
            
        except Exception as e:
            self.logger.warning(f"Error handling popup: {e}")
            return False

    def select_state(self, state_name):
        """Select a state from the dropdown"""
        try:
            # Wait for and find the state dropdown
            state_dropdown = self.wait.until(
                EC.element_to_be_clickable((By.ID, "CompanyStateCode"))
            )
            
            # Create Select object
            select = Select(state_dropdown)
            
            # Select the state by visible text (try different formats)
            state_options = [
                state_name.lower(),
                state_name.title(),
                state_name.upper(),
                state_name
            ]
            
            selected = False
            for state_option in state_options:
                try:
                    select.select_by_visible_text(state_option)
                    selected = True
                    break
                except:
                    try:
                        select.select_by_value(state_option)
                        selected = True
                        break
                    except:
                        continue
            
            if not selected:
                # Try selecting by partial text match
                options = select.options
                for option in options:
                    if state_name.lower() in option.text.lower():
                        select.select_by_visible_text(option.text)
                        selected = True
                        break
            
            if selected:
                self.logger.info(f"Selected state: {state_name}")
                time.sleep(2)  # Wait for selection to take effect
                return True
            else:
                self.logger.error(f"Could not select state: {state_name}")
                return False
                
        except TimeoutException:
            self.logger.error("Timeout waiting for state dropdown")
            return False
        except Exception as e:
            self.logger.error(f"Error selecting state: {e}")
            return False
    
    def click_preview_download(self):
        """Click the Preview & Download button"""
        try:
            # Wait for and click the Preview & Download button
            preview_button = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Preview & Download')]"))
            )
            
            # Scroll to button if needed
            self.driver.execute_script("arguments[0].scrollIntoView(true);", preview_button)
            time.sleep(1)
            
            # Click the button
            preview_button.click()
            self.logger.info("Clicked Preview & Download button")
            
            # Wait for the data to load
            time.sleep(5)
            
            return True
            
        except TimeoutException:
            self.logger.error("Timeout waiting for Preview & Download button")
            return False
        except Exception as e:
            self.logger.error(f"Error clicking Preview & Download button: {e}")
            return False
    
    def wait_for_data_load(self):
        """Wait for company data to load after clicking Preview & Download"""
        try:
            # Wait for table data to appear - try multiple selectors
            selectors_to_try = [
                "tbody[role='rowgroup']",
                "table tbody",
                ".data-table tbody",
                "tbody tr",
                "#DataTables_Table_0 tbody"
            ]
            
            data_loaded = False
            for selector in selectors_to_try:
                try:
                    self.wait.until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    self.logger.info(f"Data loaded with selector: {selector}")
                    data_loaded = True
                    break
                except TimeoutException:
                    continue
            
            if not data_loaded:
                self.logger.warning("Could not find data table with any selector")
                return False
            
            # Additional wait to ensure all data is loaded
            time.sleep(3)
            
            return True
            
        except Exception as e:
            self.logger.warning(f"Error waiting for data to load: {e}")
            return False
    
    def extract_company_data(self):
        """Extract company data from the current page"""
        companies = []
        
        try:
            # Try different selectors to find the table
            table_selectors = [
                "tbody[role='rowgroup']",
                "table tbody",
                ".data-table tbody",
                "#DataTables_Table_0 tbody"
            ]
            
            table_body = None
            for selector in table_selectors:
                try:
                    table_body = self.driver.find_element(By.CSS_SELECTOR, selector)
                    break
                except NoSuchElementException:
                    continue
            
            if not table_body:
                self.logger.error("Could not find table body")
                return []
            
            # Find all rows
            rows = table_body.find_elements(By.CSS_SELECTOR, "tr")
            self.logger.info(f"Found {len(rows)} company rows")
            
            for row in rows:
                try:
                    cells = row.find_elements(By.CSS_SELECTOR, "td")
                    
                    if len(cells) >= 10:  # Adjust based on actual column count
                        company_data = {
                            'cin': cells[0].text.strip() if len(cells) > 0 else '',
                            'company_name': cells[1].text.strip() if len(cells) > 1 else '',
                            'roc': cells[2].text.strip() if len(cells) > 2 else '',
                            'company_category': cells[3].text.strip() if len(cells) > 3 else '',
                            'company_sub_category': cells[4].text.strip() if len(cells) > 4 else '',
                            'class_of_company': cells[5].text.strip() if len(cells) > 5 else '',
                            'authorized_capital': cells[6].text.strip() if len(cells) > 6 else '',
                            'paid_up_capital': cells[7].text.strip() if len(cells) > 7 else '',
                            'date_of_incorporation': cells[8].text.strip() if len(cells) > 8 else '',
                            'registered_office_address': cells[9].text.strip() if len(cells) > 9 else '',
                            'listing_status': cells[10].text.strip() if len(cells) > 10 else '',
                            'company_status': cells[11].text.strip() if len(cells) > 11 else '',
                            'state': cells[12].text.strip() if len(cells) > 12 else '',
                            'country_of_incorporation': cells[13].text.strip() if len(cells) > 13 else '',
                            'company_type_code': cells[14].text.strip() if len(cells) > 14 else '',
                            'activity_description': cells[15].text.strip() if len(cells) > 15 else '',
                            'scraped_at': datetime.now().isoformat()
                        }
                        companies.append(company_data)
                
                except Exception as e:
                    self.logger.warning(f"Error extracting data from row: {e}")
                    continue
            
            return companies
        
        except NoSuchElementException:
            self.logger.error("No table data found on the page")
            return []
        except Exception as e:
            self.logger.error(f"Error extracting company data: {e}")
            return []
    
    def handle_pagination(self):
        """Handle pagination if available"""
        try:
            # Wait a bit before checking pagination
            time.sleep(2)
            
            # Look for next page button or pagination with more specific selectors
            next_selectors = [
                ".dataTables_paginate .paginate_button.next:not(.disabled)",
                "a.paginate_button.next:not(.disabled)",
                "button.paginate_button.next:not(.disabled)",
                ".pagination .next:not(.disabled)",
                "a[aria-label='Next']:not(.disabled)",
                "button[aria-label='Next']:not(.disabled)",
                "//a[contains(@class, 'next') and not(contains(@class, 'disabled'))]",
                "//button[contains(@class, 'next') and not(contains(@class, 'disabled'))]",
                "//a[contains(text(), 'Next') and not(contains(@class, 'disabled'))]",
                "//button[contains(text(), 'Next') and not(contains(@class, 'disabled'))]"
            ]
            
            for selector in next_selectors:
                try:
                    if selector.startswith("//"):
                        next_buttons = self.driver.find_elements(By.XPATH, selector)
                    else:
                        next_buttons = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    for next_button in next_buttons:
                        if (next_button.is_enabled() and 
                            next_button.is_displayed() and 
                            'disabled' not in next_button.get_attribute('class').lower()):
                            
                            # Scroll to button
                            self.driver.execute_script("arguments[0].scrollIntoView(true);", next_button)
                            time.sleep(1)
                            
                            # Click the button
                            next_button.click()
                            self.logger.info(f"Clicked next page button with selector: {selector}")
                            
                            # Wait for new data to load
                            time.sleep(3)
                            
                            # Verify that new data loaded by checking if URL changed or content updated
                            if self.wait_for_data_load():
                                return True
                            else:
                                self.logger.warning("Data didn't load after clicking next page")
                                return False
                                
                except Exception as e:
                    self.logger.debug(f"Failed to click with selector {selector}: {e}")
                    continue
            
            self.logger.info("No enabled next page button found")
            return False
        
        except Exception as e:
            self.logger.info(f"No more pages available: {e}")
            return False
    
    def fetch_companies_by_state(self, state_name, max_pages=None):
        """Fetch all companies for a specific state"""
        self.logger.info(f"Starting to fetch companies for state: {state_name}")
        
        all_companies = []
        page_count = 0
        
        try:
            # Navigate to the page
            if not self.navigate_to_page():
                return []
            
            # Select the state
            if not self.select_state(state_name):
                return []
            
            # Click Preview & Download button
            if not self.click_preview_download():
                return []
            
            # Wait for data to load
            if not self.wait_for_data_load():
                self.logger.warning(f"No data loaded for state: {state_name}")
                return []
            
            # Extract data from current page
            while True:
                page_count += 1
                self.logger.info(f"Extracting data from page {page_count}")
                
                companies = self.extract_company_data()
                if companies:
                    all_companies.extend(companies)
                    self.logger.info(f"Extracted {len(companies)} companies from page {page_count}")
                else:
                    self.logger.warning(f"No companies found on page {page_count}")
                    break
                
                # Check if we've reached max pages
                if max_pages and page_count >= max_pages:
                    self.logger.info(f"Reached maximum pages limit: {max_pages}")
                    break
                
                # Try to go to next page
                if not self.handle_pagination():
                    self.logger.info("No more pages available")
                    break
                
                # Small delay between pages
                time.sleep(2)
        
        except Exception as e:
            self.logger.error(f"Error fetching companies for {state_name}: {e}")
        
        self.logger.info(f"Total companies fetched for {state_name}: {len(all_companies)}")
        return all_companies
    
    def fetch_all_states_data(self, selected_states=None, max_pages_per_state=None):
        """Fetch company data for all states or selected states"""
        states_to_fetch = selected_states if selected_states else self.states
        all_data = {}
        
        try:
            self.setup_driver()
            
            for state in states_to_fetch:
                self.logger.info(f"Processing state: {state}")
                
                try:
                    companies = self.fetch_companies_by_state(state, max_pages_per_state)
                    all_data[state] = companies
                    
                    # Save individual state data
                    if companies:
                        self.save_to_csv(companies, f"companies_{state.replace(' ', '_').replace('&', 'and')}.csv")
                        self.logger.info(f"Saved {len(companies)} companies for {state}")
                    else:
                        self.logger.warning(f"No companies found for {state}")
                
                except Exception as e:
                    self.logger.error(f"Error processing state {state}: {e}")
                    all_data[state] = []
                    continue
                
                # Small delay between states
                time.sleep(3)
        
        finally:
            self.close_driver()
        
        return all_data
    
    def save_to_csv(self, companies, filename):
        """Save company data to CSV file"""
        if not companies:
            return
        
        try:
            df = pd.DataFrame(companies)
            df.to_csv(filename, index=False, encoding='utf-8')
            self.logger.info(f"Saved {len(companies)} companies to {filename}")
        except Exception as e:
            self.logger.error(f"Error saving to CSV: {e}")
    
    def save_to_json(self, data, filename):
        """Save data to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            self.logger.info(f"Saved data to {filename}")
        except Exception as e:
            self.logger.error(f"Error saving to JSON: {e}")
    
    def get_company_statistics(self, companies):
        """Generate statistics for the fetched companies"""
        if not companies:
            return {}
        
        try:
            df = pd.DataFrame(companies)
            
            stats = {
                'total_companies': len(companies),
                'companies_by_status': df['company_status'].value_counts().to_dict(),
                'companies_by_category': df['company_category'].value_counts().to_dict(),
                'companies_by_roc': df['roc'].value_counts().to_dict(),
                'top_activities': df['activity_description'].value_counts().head(10).to_dict(),
                'companies_by_class': df['class_of_company'].value_counts().to_dict()
            }
            
            return stats
        except Exception as e:
            self.logger.error(f"Error generating statistics: {e}")
            return {}

def main():
    """Main function to run the crawler"""
    crawler = ROCCompanyCrawler(headless=False)  # Set to True for headless mode
    
    # Example 1: Fetch data for specific states
    selected_states = ["andaman and nicobar islands", "goa", "delhi", "maharashtra"]
    
    print("Starting ROC Company Data Crawler with Selenium...")
    
    try:
        # Fetch data for selected states (increase pages per state)
        all_data = crawler.fetch_all_states_data(
            selected_states=selected_states, 
            max_pages_per_state=5  # Increased from 2 to 5
        )
        
        # Save combined data
        crawler.save_to_json(all_data, f"all_companies_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        
        # Generate and display statistics
        total_companies = 0
        for state, companies in all_data.items():
            if companies:
                stats = crawler.get_company_statistics(companies)
                print(f"\n=== Statistics for {state.title()} ===")
                print(f"Total Companies: {stats.get('total_companies', 0)}")
                print(f"Active Companies: {stats.get('companies_by_status', {}).get('Active', 0)}")
                if stats.get('companies_by_roc'):
                    print(f"Top ROC: {list(stats['companies_by_roc'].keys())[0]}")
                total_companies += len(companies)
        
        print(f"\n=== OVERALL SUMMARY ===")
        print(f"Total States Processed: {len([s for s, c in all_data.items() if c])}")
        print(f"Total Companies Scraped: {total_companies}")
        
        print("\nCrawling completed successfully!")
        
    except Exception as e:
        print(f"Error during crawling: {e}")
        logging.error(f"Main execution error: {e}")

if __name__ == "__main__":
    main()