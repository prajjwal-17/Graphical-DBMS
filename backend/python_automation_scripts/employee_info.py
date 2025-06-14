import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
from datetime import datetime

class CompanyDataManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Company Data Manager")
        self.root.geometry("800x600")
        
        # Data storage
        self.companies = []
        self.load_data()
        
        # Create GUI
        self.create_widgets()
        
    def create_widgets(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Company entry section
        entry_frame = ttk.LabelFrame(main_frame, text="Add New Company", padding="10")
        entry_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Company name
        ttk.Label(entry_frame, text="Company Name:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.company_name_var = tk.StringVar()
        ttk.Entry(entry_frame, textvariable=self.company_name_var, width=50).grid(row=0, column=1, sticky=(tk.W, tk.E), pady=2)
        
        # Directors section
        ttk.Label(entry_frame, text="Directors:", font=('TkDefaultFont', 10, 'bold')).grid(row=1, column=0, sticky=tk.W, pady=(10, 5))
        
        # Directors frame
        directors_frame = ttk.Frame(entry_frame)
        directors_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        # Directors listbox with scrollbar
        listbox_frame = ttk.Frame(directors_frame)
        listbox_frame.grid(row=0, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.directors_listbox = tk.Listbox(listbox_frame, height=6)
        scrollbar = ttk.Scrollbar(listbox_frame, orient="vertical", command=self.directors_listbox.yview)
        self.directors_listbox.configure(yscrollcommand=scrollbar.set)
        
        self.directors_listbox.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # Director input fields
        ttk.Label(directors_frame, text="DIN/PAN:").grid(row=1, column=0, sticky=tk.W, padx=(0, 5))
        self.din_pan_var = tk.StringVar()
        ttk.Entry(directors_frame, textvariable=self.din_pan_var, width=15).grid(row=1, column=1, padx=5)
        
        ttk.Label(directors_frame, text="Name:").grid(row=1, column=2, sticky=tk.W, padx=(10, 5))
        self.director_name_var = tk.StringVar()
        ttk.Entry(directors_frame, textvariable=self.director_name_var, width=25).grid(row=1, column=3, padx=5)
        
        ttk.Label(directors_frame, text="Designation:").grid(row=2, column=0, sticky=tk.W, padx=(0, 5), pady=(5, 0))
        self.designation_var = tk.StringVar(value="Director")
        ttk.Entry(directors_frame, textvariable=self.designation_var, width=15).grid(row=2, column=1, padx=5, pady=(5, 0))
        
        # Director buttons
        button_frame = ttk.Frame(directors_frame)
        button_frame.grid(row=2, column=2, columnspan=2, sticky=tk.W, padx=(10, 0), pady=(5, 0))
        
        ttk.Button(button_frame, text="Add Director", command=self.add_director).grid(row=0, column=0, padx=(0, 5))
        ttk.Button(button_frame, text="Remove Selected", command=self.remove_director).grid(row=0, column=1)
        
        # Company buttons
        company_button_frame = ttk.Frame(entry_frame)
        company_button_frame.grid(row=3, column=0, columnspan=2, pady=(10, 0))
        
        ttk.Button(company_button_frame, text="Add Company", command=self.add_company).grid(row=0, column=0, padx=(0, 10))
        ttk.Button(company_button_frame, text="Clear Form", command=self.clear_form).grid(row=0, column=1)
        
        # Existing companies section
        companies_frame = ttk.LabelFrame(main_frame, text="Existing Companies", padding="10")
        companies_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(10, 0))
        
        # Companies treeview
        self.tree = ttk.Treeview(companies_frame, columns=("Company", "Directors"), show="headings", height=10)
        self.tree.heading("Company", text="Company Name")
        self.tree.heading("Directors", text="Number of Directors")
        self.tree.column("Company", width=400)
        self.tree.column("Directors", width=150)
        
        tree_scroll = ttk.Scrollbar(companies_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=tree_scroll.set)
        
        self.tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        tree_scroll.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # Action buttons
        action_frame = ttk.Frame(companies_frame)
        action_frame.grid(row=1, column=0, columnspan=2, pady=(10, 0))
        
        ttk.Button(action_frame, text="View Details", command=self.view_company_details).grid(row=0, column=0, padx=(0, 10))
        ttk.Button(action_frame, text="Delete Company", command=self.delete_company).grid(row=0, column=1, padx=(0, 10))
        ttk.Button(action_frame, text="Download JSON", command=self.download_json).grid(row=0, column=2, padx=(0, 10))
        ttk.Button(action_frame, text="Load Data", command=self.load_data_file).grid(row=0, column=3)
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(1, weight=1)
        entry_frame.columnconfigure(1, weight=1)
        companies_frame.columnconfigure(0, weight=1)
        companies_frame.rowconfigure(0, weight=1)
        listbox_frame.columnconfigure(0, weight=1)
        
        # Current directors for the form
        self.current_directors = []
        
        # Load existing companies into treeview
        self.refresh_treeview()
        
    def add_director(self):
        din_pan = self.din_pan_var.get().strip()
        name = self.director_name_var.get().strip()
        designation = self.designation_var.get().strip()
        
        if not din_pan or not name:
            messagebox.showwarning("Warning", "Please enter both DIN/PAN and Name")
            return
            
        director = {
            "din_pan": din_pan,
            "name": name.upper(),
            "designation": designation
        }
        
        self.current_directors.append(director)
        self.directors_listbox.insert(tk.END, f"{din_pan} - {name.upper()} ({designation})")
        
        # Clear director input fields
        self.din_pan_var.set("")
        self.director_name_var.set("")
        self.designation_var.set("Director")
        
    def remove_director(self):
        selection = self.directors_listbox.curselection()
        if selection:
            index = selection[0]
            self.directors_listbox.delete(index)
            del self.current_directors[index]
            
    def add_company(self):
        company_name = self.company_name_var.get().strip()
        
        if not company_name:
            messagebox.showwarning("Warning", "Please enter company name")
            return
            
        if not self.current_directors:
            messagebox.showwarning("Warning", "Please add at least one director")
            return
            
        company = {
            "company_name": company_name.upper(),
            "directors": self.current_directors.copy(),
            "created_date": datetime.now().isoformat()
        }
        
        self.companies.append(company)
        self.save_data()
        self.refresh_treeview()
        self.clear_form()
        
        messagebox.showinfo("Success", f"Company '{company_name}' added successfully!")
        
    def clear_form(self):
        self.company_name_var.set("")
        self.din_pan_var.set("")
        self.director_name_var.set("")
        self.designation_var.set("Director")
        self.directors_listbox.delete(0, tk.END)
        self.current_directors.clear()
        
    def refresh_treeview(self):
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        # Add companies
        for i, company in enumerate(self.companies):
            self.tree.insert("", tk.END, values=(
                company["company_name"],
                len(company["directors"])
            ), tags=(str(i),))
            
    def view_company_details(self):
        selection = self.tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a company")
            return
            
        item = self.tree.item(selection[0])
        company_index = int(item['tags'][0])
        company = self.companies[company_index]
        
        # Create details window
        details_window = tk.Toplevel(self.root)
        details_window.title(f"Company Details - {company['company_name']}")
        details_window.geometry("600x400")
        
        # Company info
        info_frame = ttk.Frame(details_window, padding="10")
        info_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(info_frame, text=f"Company: {company['company_name']}", font=('TkDefaultFont', 12, 'bold')).pack(anchor=tk.W, pady=(0, 10))
        
        # Directors table
        ttk.Label(info_frame, text="Directors:", font=('TkDefaultFont', 10, 'bold')).pack(anchor=tk.W, pady=(0, 5))
        
        directors_tree = ttk.Treeview(info_frame, columns=("DIN/PAN", "Name", "Designation"), show="headings")
        directors_tree.heading("DIN/PAN", text="DIN/PAN")
        directors_tree.heading("Name", text="Name")
        directors_tree.heading("Designation", text="Designation")
        
        for director in company["directors"]:
            directors_tree.insert("", tk.END, values=(
                director["din_pan"],
                director["name"],
                director["designation"]
            ))
            
        directors_tree.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        ttk.Label(info_frame, text=f"Created: {company.get('created_date', 'Unknown')}").pack(anchor=tk.W)
        
    def delete_company(self):
        selection = self.tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a company")
            return
            
        item = self.tree.item(selection[0])
        company_index = int(item['tags'][0])
        company_name = self.companies[company_index]["company_name"]
        
        if messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete '{company_name}'?"):
            del self.companies[company_index]
            self.save_data()
            self.refresh_treeview()
            messagebox.showinfo("Success", "Company deleted successfully!")
            
    def download_json(self):
        if not self.companies:
            messagebox.showwarning("Warning", "No companies to download")
            return
            
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initialfile=f"companies_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(self.companies, f, indent=2, ensure_ascii=False)
                messagebox.showinfo("Success", f"Data exported successfully to {file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to export data: {str(e)}")
                
    def save_data(self):
        try:
            with open('companies_data.json', 'w', encoding='utf-8') as f:
                json.dump(self.companies, f, indent=2, ensure_ascii=False)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save data: {str(e)}")
            
    def load_data(self):
        try:
            if os.path.exists('companies_data.json'):
                with open('companies_data.json', 'r', encoding='utf-8') as f:
                    self.companies = json.load(f)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load data: {str(e)}")
            self.companies = []
            
    def load_data_file(self):
        file_path = filedialog.askopenfilename(
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)
                    
                if isinstance(loaded_data, list):
                    self.companies = loaded_data
                    self.save_data()
                    self.refresh_treeview()
                    messagebox.showinfo("Success", "Data loaded successfully!")
                else:
                    messagebox.showerror("Error", "Invalid JSON format. Expected a list of companies.")
                    
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load data: {str(e)}")

def main():
    root = tk.Tk()
    app = CompanyDataManager(root)
    
    # Add sample data for demonstration
    sample_company = {
        "company_name": "U AND I RESORTS PRIVATE LIMITED",
        "directors": [
            {
                "din_pan": "02533987",
                "name": "MARK DOUGLAS HILL",
                "designation": "Director"
            },
            {
                "din_pan": "08703371",
                "name": "CHITRASAN RAI",
                "designation": "Director"
            }
        ],
        "created_date": datetime.now().isoformat()
    }
    
    # Add sample data if no existing data
    if not app.companies:
        app.companies.append(sample_company)
        app.save_data()
        app.refresh_treeview()
    
    root.mainloop()

if __name__ == "__main__":
    main()