import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import json
from datetime import datetime
import os

class CompanyDataEntry:
    def __init__(self, root):
        self.root = root
        self.root.title("Company Data Entry Application")
        self.root.geometry("800x600")
        
        # Data storage
        self.all_companies_data = {}
        self.final_signatory_data = []
        self.directors_data = []
        self.missing_companies = []
        self.current_company_index = 0
        
        self.setup_ui()
        
    def setup_ui(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # File loading section
        file_frame = ttk.LabelFrame(main_frame, text="Load Data Files", padding="10")
        file_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(file_frame, text="Load All Companies Data (A)", 
                  command=self.load_all_companies).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(file_frame, text="Load Final Signatory Data (B)", 
                  command=self.load_final_signatory).grid(row=0, column=1, padx=5)
        ttk.Button(file_frame, text="Load Directors Data (C)", 
                  command=self.load_directors_data).grid(row=0, column=2, padx=(5, 0))
        
        ttk.Button(file_frame, text="Find Missing Companies", 
                  command=self.find_missing_companies).grid(row=1, column=0, columnspan=3, pady=(10, 0))
        
        # Status label
        self.status_label = ttk.Label(file_frame, text="Load all three files to begin")
        self.status_label.grid(row=2, column=0, columnspan=3, pady=(5, 0))
        
        # Company entry section
        entry_frame = ttk.LabelFrame(main_frame, text="Company Details Entry", padding="10")
        entry_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        
        # Company info display
        info_frame = ttk.Frame(entry_frame)
        info_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.company_info_label = ttk.Label(info_frame, text="No company loaded", 
                                           font=("Arial", 12, "bold"))
        self.company_info_label.grid(row=0, column=0, sticky=tk.W)
        
        self.progress_label = ttk.Label(info_frame, text="")
        self.progress_label.grid(row=1, column=0, sticky=tk.W)
        
        # Entry fields
        basic_fields = [
            ("CIN:", "cin"),
            ("Company Name:", "company_name"),
            ("Date of Incorporation (DD/MM/YYYY):", "date_of_incorporation"),
            ("Paid Up Capital:", "paid_up_capital"),
            ("State:", "state")
        ]
        
        self.entries = {}
        current_row = 2
        
        # Basic entry fields
        for i, (label, field) in enumerate(basic_fields):
            ttk.Label(entry_frame, text=label).grid(row=current_row, column=0, sticky=tk.W, pady=2)
            entry = ttk.Entry(entry_frame, width=50)
            entry.grid(row=current_row, column=1, sticky=(tk.W, tk.E), padx=(10, 0), pady=2)
            self.entries[field] = entry
            current_row += 1
        
        # Company Sub Category with radio buttons
        ttk.Label(entry_frame, text="Company Sub Category:").grid(row=current_row, column=0, sticky=tk.W, pady=2)
        
        sub_category_frame = ttk.Frame(entry_frame)
        sub_category_frame.grid(row=current_row, column=1, sticky=(tk.W, tk.E), padx=(10, 0), pady=2)
        
        self.sub_category_var = tk.StringVar(value="")
        
        ttk.Radiobutton(sub_category_frame, text="Non-government company", 
                       variable=self.sub_category_var, value="Non-government company",
                       command=self.on_sub_category_change).grid(row=0, column=0, sticky=tk.W)
        
        ttk.Radiobutton(sub_category_frame, text="Union government company", 
                       variable=self.sub_category_var, value="Union government company",
                       command=self.on_sub_category_change).grid(row=0, column=1, sticky=tk.W, padx=(10, 0))
        
        ttk.Radiobutton(sub_category_frame, text="Other:", 
                       variable=self.sub_category_var, value="other",
                       command=self.on_sub_category_change).grid(row=0, column=2, sticky=tk.W, padx=(10, 0))
        
        self.sub_category_entry = ttk.Entry(sub_category_frame, width=30, state="disabled")
        self.sub_category_entry.grid(row=0, column=3, sticky=(tk.W, tk.E), padx=(5, 0))
        
        sub_category_frame.columnconfigure(3, weight=1)
        
        # Buttons
        button_frame = ttk.Frame(entry_frame)
        button_frame.grid(row=current_row+1, column=0, columnspan=2, pady=(20, 0))
        
        ttk.Button(button_frame, text="Previous", 
                  command=self.previous_company).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(button_frame, text="Save & Next", 
                  command=self.save_and_next).grid(row=0, column=1, padx=5)
        ttk.Button(button_frame, text="Skip", 
                  command=self.skip_company).grid(row=0, column=2, padx=5)
        ttk.Button(button_frame, text="Save All Data", 
                  command=self.save_all_data).grid(row=0, column=3, padx=(5, 0))
        
        # Configure grid weights
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(1, weight=1)
        entry_frame.columnconfigure(1, weight=1)
    
    def on_sub_category_change(self):
        """Handle radio button changes for company sub category"""
        if self.sub_category_var.get() == "other":
            self.sub_category_entry.config(state="normal")
            self.sub_category_entry.focus()
        else:
            self.sub_category_entry.config(state="disabled")
            self.sub_category_entry.delete(0, tk.END)
        
    def load_all_companies(self):
        file_path = filedialog.askopenfilename(
            title="Select All Companies Data JSON file",
            filetypes=[("JSON files", "*.json")]
        )
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.all_companies_data = json.load(f)
                messagebox.showinfo("Success", f"Loaded {len(self.all_companies_data)} states with company data")
                self.update_status()
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load file: {str(e)}")
    
    def load_final_signatory(self):
        file_path = filedialog.askopenfilename(
            title="Select Final Signatory Data JSON file",
            filetypes=[("JSON files", "*.json")]
        )
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.final_signatory_data = json.load(f)
                messagebox.showinfo("Success", f"Loaded {len(self.final_signatory_data)} companies with signatory data")
                self.update_status()
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load file: {str(e)}")
    
    def load_directors_data(self):
        file_path = filedialog.askopenfilename(
            title="Select Directors Data JSON file",
            filetypes=[("JSON files", "*.json")]
        )
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.directors_data = json.load(f)
                messagebox.showinfo("Success", f"Loaded {len(self.directors_data)} directors with position data")
                self.update_status()
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load file: {str(e)}")
    
    def update_status(self):
        loaded_files = []
        if self.all_companies_data:
            loaded_files.append("All Companies")
        if self.final_signatory_data:
            loaded_files.append("Final Signatory")
        if self.directors_data:
            loaded_files.append("Directors Data")
        
        if len(loaded_files) == 3:
            self.status_label.config(text="All files loaded. Click 'Find Missing Companies' to begin.")
        else:
            self.status_label.config(text=f"Loaded: {', '.join(loaded_files)}")
    
    def find_missing_companies(self):
        if not all([self.all_companies_data, self.final_signatory_data, self.directors_data]):
            messagebox.showerror("Error", "Please load all three data files first")
            return
        
        # Get all company names from existing data
        existing_companies = set()
        
        # From all companies data
        for state_companies in self.all_companies_data.values():
            for company in state_companies:
                existing_companies.add(company["company_name"])
        
        # From final signatory data
        for company in self.final_signatory_data:
            existing_companies.add(company["company_name"])
        
        # Find missing companies from directors data
        missing_companies = []
        for director in self.directors_data:
            for position in director["positions"]:
                company_name = position["company_name"]
                if company_name not in existing_companies:
                    # Check if we already have this company in our missing list
                    if not any(mc["company_name"] == company_name for mc in missing_companies):
                        missing_companies.append({
                            "cin": position["cin"],
                            "company_name": company_name,
                            "director_name": director["name"],
                            "din": director["din"],
                            "designation": position["designation"]
                        })
        
        self.missing_companies = missing_companies
        self.current_company_index = 0
        
        if missing_companies:
            messagebox.showinfo("Missing Companies Found", 
                              f"Found {len(missing_companies)} companies that need data entry")
            self.load_current_company()
        else:
            messagebox.showinfo("Complete", "No missing companies found. All companies already have data!")
    
    def load_current_company(self):
        if not self.missing_companies or self.current_company_index >= len(self.missing_companies):
            messagebox.showinfo("Complete", "All companies have been processed!")
            return
        
        company = self.missing_companies[self.current_company_index]
        
        # Update display
        self.company_info_label.config(
            text=f"Company: {company['company_name']}\n"
                 f"Director: {company['director_name']} ({company['din']})"
        )
        self.progress_label.config(
            text=f"Company {self.current_company_index + 1} of {len(self.missing_companies)}"
        )
        
        # Pre-fill known data
        self.entries["cin"].delete(0, tk.END)
        self.entries["cin"].insert(0, company["cin"])
        
        self.entries["company_name"].delete(0, tk.END)
        self.entries["company_name"].insert(0, company["company_name"])
        
        # Clear other fields
        for field in ["date_of_incorporation", "paid_up_capital", "state"]:
            self.entries[field].delete(0, tk.END)
        
        # Reset sub category radio buttons
        self.sub_category_var.set("")
        self.sub_category_entry.config(state="disabled")
        self.sub_category_entry.delete(0, tk.END)
    
    def validate_date(self, date_string):
        """Validate and convert date from DD/MM/YYYY to YYYY-MM-DD format"""
        try:
            # Try to parse DD/MM/YYYY format
            date_obj = datetime.strptime(date_string, "%d/%m/%Y")
            return date_obj.strftime("%Y-%m-%d")
        except ValueError:
            try:
                # If that fails, try YYYY-MM-DD format (already correct)
                datetime.strptime(date_string, "%Y-%m-%d")
                return date_string
            except ValueError:
                return None
    
    def clean_paid_up_capital(self, amount_string):
        """Remove commas from paid up capital amount"""
        return amount_string.replace(",", "")
    
    def save_and_next(self):
        if not self.missing_companies:
            messagebox.showerror("Error", "No companies to process")
            return
        
        # Validate required fields
        required_fields = ["cin", "company_name", "date_of_incorporation", 
                          "paid_up_capital", "state"]
        
        for field in required_fields:
            if not self.entries[field].get().strip():
                messagebox.showerror("Error", f"Please fill in the {field.replace('_', ' ').title()} field")
                return
        
        # Validate company sub category
        if not self.sub_category_var.get():
            messagebox.showerror("Error", "Please select a Company Sub Category")
            return
        
        if self.sub_category_var.get() == "other" and not self.sub_category_entry.get().strip():
            messagebox.showerror("Error", "Please enter the Company Sub Category in the text field")
            return
        
        # Validate and convert date format
        converted_date = self.validate_date(self.entries["date_of_incorporation"].get())
        if not converted_date:
            messagebox.showerror("Error", "Date of incorporation must be in DD/MM/YYYY format")
            return
        
        # Save current company data
        company_data = {}
        for field in required_fields:
            if field == "date_of_incorporation":
                company_data[field] = converted_date
            elif field == "paid_up_capital":
                company_data[field] = self.clean_paid_up_capital(self.entries[field].get().strip())
            else:
                company_data[field] = self.entries[field].get().strip()
        
        # Add company sub category
        if self.sub_category_var.get() == "other":
            company_data["company_sub_category"] = self.sub_category_entry.get().strip()
        else:
            company_data["company_sub_category"] = self.sub_category_var.get()
        
        # Add to missing companies list with complete data
        self.missing_companies[self.current_company_index]["company_data"] = company_data
        
        # Move to next company
        self.current_company_index += 1
        self.load_current_company()
    
    def skip_company(self):
        if not self.missing_companies:
            return
        
        self.current_company_index += 1
        self.load_current_company()
    
    def previous_company(self):
        if self.current_company_index > 0:
            self.current_company_index -= 1
            self.load_current_company()
    
    def save_all_data(self):
        # Collect all completed company data
        completed_companies = [mc for mc in self.missing_companies if "company_data" in mc]
        
        if not completed_companies:
            messagebox.showwarning("Warning", "No company data to save")
            return
        
        # Prepare data for saving
        save_data = []
        for company in completed_companies:
            data = company["company_data"].copy()
            data["added_from_directors_data"] = {
                "director_name": company["director_name"],
                "din": company["din"],
                "designation": company["designation"]
            }
            data["created_date"] = datetime.now().isoformat()
            save_data.append(data)
        
        # Save to file
        file_path = filedialog.asksaveasfilename(
            title="Save New Company Data",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json")]
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(save_data, f, indent=2, ensure_ascii=False)
                messagebox.showinfo("Success", 
                                  f"Saved {len(save_data)} companies to {os.path.basename(file_path)}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save file: {str(e)}")

def main():
    root = tk.Tk()
    app = CompanyDataEntry(root)
    root.mainloop()

if __name__ == "__main__":
    main()