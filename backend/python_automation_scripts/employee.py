import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import os
from datetime import datetime

class DirectorCompanyManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Director Company Manager")
        self.root.geometry("1000x700")
        
        # Data storage
        self.directors = []
        self.load_data()
        
        # Create GUI
        self.create_widgets()
        
    def create_widgets(self):
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Director entry section
        entry_frame = ttk.LabelFrame(main_frame, text="Add New Director", padding="10")
        entry_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # Director basic info
        basic_frame = ttk.Frame(entry_frame)
        basic_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Label(basic_frame, text="Director Name:").grid(row=0, column=0, sticky=tk.W, pady=2, padx=(0, 5))
        self.director_name_var = tk.StringVar()
        ttk.Entry(basic_frame, textvariable=self.director_name_var, width=30).grid(row=0, column=1, sticky=tk.W, pady=2, padx=5)
        
        ttk.Label(basic_frame, text="DIN:").grid(row=0, column=2, sticky=tk.W, pady=2, padx=(20, 5))
        self.din_var = tk.StringVar()
        ttk.Entry(basic_frame, textvariable=self.din_var, width=15).grid(row=0, column=3, sticky=tk.W, pady=2, padx=5)
        
        # Company positions section
        ttk.Label(entry_frame, text="Company Positions:", font=('TkDefaultFont', 10, 'bold')).grid(row=1, column=0, sticky=tk.W, pady=(10, 5))
        
        # Company positions frame
        positions_frame = ttk.Frame(entry_frame)
        positions_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        # Positions listbox with scrollbar
        listbox_frame = ttk.Frame(positions_frame)
        listbox_frame.grid(row=0, column=0, columnspan=6, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.positions_listbox = tk.Listbox(listbox_frame, height=8)
        scrollbar = ttk.Scrollbar(listbox_frame, orient="vertical", command=self.positions_listbox.yview)
        self.positions_listbox.configure(yscrollcommand=scrollbar.set)
        
        self.positions_listbox.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # Company input fields - Row 1
        ttk.Label(positions_frame, text="CIN:").grid(row=1, column=0, sticky=tk.W, padx=(0, 5))
        self.cin_var = tk.StringVar()
        ttk.Entry(positions_frame, textvariable=self.cin_var, width=25).grid(row=1, column=1, padx=5)
        
        ttk.Label(positions_frame, text="Company Name:").grid(row=1, column=2, sticky=tk.W, padx=(10, 5))
        self.company_name_var = tk.StringVar()
        ttk.Entry(positions_frame, textvariable=self.company_name_var, width=35).grid(row=1, column=3, padx=5)
        
        # Company input fields - Row 2
        ttk.Label(positions_frame, text="Designation:").grid(row=2, column=0, sticky=tk.W, padx=(0, 5), pady=(5, 0))
        self.designation_var = tk.StringVar()
        designation_combo = ttk.Combobox(positions_frame, textvariable=self.designation_var, width=25,
                                        values=["Managing Director", "Director", "Additional Director", 
                                               "Whole-time director", "Independent Director", "Executive Director"])
        designation_combo.grid(row=2, column=1, columnspan=2, padx=5, pady=(5, 0), sticky=tk.W)
        
        # Position buttons
        position_button_frame = ttk.Frame(positions_frame)
        position_button_frame.grid(row=3, column=0, columnspan=4, pady=(10, 0))
        
        ttk.Button(position_button_frame, text="Add Position", command=self.add_position).grid(row=0, column=0, padx=(0, 10))
        ttk.Button(position_button_frame, text="Remove Selected", command=self.remove_position).grid(row=0, column=1)
        
        # Director buttons
        director_button_frame = ttk.Frame(entry_frame)
        director_button_frame.grid(row=3, column=0, columnspan=2, pady=(10, 0))
        
        ttk.Button(director_button_frame, text="Add Director", command=self.add_director).grid(row=0, column=0, padx=(0, 10))
        ttk.Button(director_button_frame, text="Clear Form", command=self.clear_form).grid(row=0, column=1)
        
        # Existing directors section
        directors_frame = ttk.LabelFrame(main_frame, text="Existing Directors", padding="10")
        directors_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(10, 0))
        
        # Directors treeview
        self.tree = ttk.Treeview(directors_frame, columns=("Name", "DIN", "Companies", "Positions"), show="headings", height=12)
        self.tree.heading("Name", text="Director Name")
        self.tree.heading("DIN", text="DIN")
        self.tree.heading("Companies", text="No. of Companies")
        self.tree.heading("Positions", text="Total Positions")
        
        self.tree.column("Name", width=250)
        self.tree.column("DIN", width=100)
        self.tree.column("Companies", width=120)
        self.tree.column("Positions", width=120)
        
        tree_scroll = ttk.Scrollbar(directors_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=tree_scroll.set)
        
        self.tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        tree_scroll.grid(row=0, column=1, sticky=(tk.N, tk.S))
        
        # Action buttons
        action_frame = ttk.Frame(directors_frame)
        action_frame.grid(row=1, column=0, columnspan=2, pady=(10, 0))
        
        ttk.Button(action_frame, text="View Details", command=self.view_director_details).grid(row=0, column=0, padx=(0, 10))
        ttk.Button(action_frame, text="Delete Director", command=self.delete_director).grid(row=0, column=1, padx=(0, 10))
        ttk.Button(action_frame, text="Download JSON", command=self.download_json).grid(row=0, column=2, padx=(0, 10))
        ttk.Button(action_frame, text="Load Data", command=self.load_data_file).grid(row=0, column=3)
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(1, weight=1)
        entry_frame.columnconfigure(0, weight=1)
        directors_frame.columnconfigure(0, weight=1)
        directors_frame.rowconfigure(0, weight=1)
        listbox_frame.columnconfigure(0, weight=1)
        
        # Current positions for the form
        self.current_positions = []
        
        # Load existing directors into treeview
        self.refresh_treeview()
        
    def add_position(self):
        cin = self.cin_var.get().strip()
        company_name = self.company_name_var.get().strip()
        designation = self.designation_var.get().strip()
        
        if not cin or not company_name or not designation:
            messagebox.showwarning("Warning", "Please enter CIN, Company Name, and Designation")
            return
            
        position = {
            "cin": cin.upper(),
            "company_name": company_name.upper(),
            "designation": designation
        }
        
        self.current_positions.append(position)
        
        display_text = f"{cin} | {company_name} | {designation}"
        self.positions_listbox.insert(tk.END, display_text)
        
        # Clear position input fields
        self.cin_var.set("")
        self.company_name_var.set("")
        self.designation_var.set("")
        
    def remove_position(self):
        selection = self.positions_listbox.curselection()
        if selection:
            index = selection[0]
            self.positions_listbox.delete(index)
            del self.current_positions[index]
            
    def add_director(self):
        director_name = self.director_name_var.get().strip()
        din = self.din_var.get().strip()
        
        if not director_name or not din:
            messagebox.showwarning("Warning", "Please enter Director Name and DIN")
            return
            
        if not self.current_positions:
            messagebox.showwarning("Warning", "Please add at least one company position")
            return
            
        # Check if director already exists
        for existing_director in self.directors:
            if existing_director["din"] == din:
                messagebox.showwarning("Warning", f"Director with DIN {din} already exists")
                return
                
        director = {
            "name": director_name.upper(),
            "din": din,
            "positions": self.current_positions.copy(),
            "created_date": datetime.now().isoformat()
        }
        
        self.directors.append(director)
        self.save_data()
        self.refresh_treeview()
        self.clear_form()
        
        messagebox.showinfo("Success", f"Director '{director_name}' added successfully!")
        
    def clear_form(self):
        self.director_name_var.set("")
        self.din_var.set("")
        self.cin_var.set("")
        self.company_name_var.set("")
        self.designation_var.set("")
        self.positions_listbox.delete(0, tk.END)
        self.current_positions.clear()
        
    def refresh_treeview(self):
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        # Add directors
        for i, director in enumerate(self.directors):
            unique_companies = len(set(pos["cin"] for pos in director["positions"]))
            total_positions = len(director["positions"])
            
            self.tree.insert("", tk.END, values=(
                director["name"],
                director["din"],
                unique_companies,
                total_positions
            ), tags=(str(i),))
            
    def view_director_details(self):
        selection = self.tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a director")
            return
            
        item = self.tree.item(selection[0])
        director_index = int(item['tags'][0])
        director = self.directors[director_index]
        
        # Create details window
        details_window = tk.Toplevel(self.root)
        details_window.title(f"Director Details - {director['name']}")
        details_window.geometry("1200x600")
        
        # Director info
        info_frame = ttk.Frame(details_window, padding="10")
        info_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(info_frame, text=f"Director: {director['name']}", font=('TkDefaultFont', 12, 'bold')).pack(anchor=tk.W, pady=(0, 5))
        ttk.Label(info_frame, text=f"DIN: {director['din']}", font=('TkDefaultFont', 10)).pack(anchor=tk.W, pady=(0, 10))
        
        # Positions table
        ttk.Label(info_frame, text="Company Positions:", font=('TkDefaultFont', 10, 'bold')).pack(anchor=tk.W, pady=(0, 5))
        
        positions_tree = ttk.Treeview(info_frame, columns=("Sr", "CIN", "Company", "Designation"), show="headings", height=15)
        positions_tree.heading("Sr", text="Sr. No")
        positions_tree.heading("CIN", text="CIN")
        positions_tree.heading("Company", text="Company Name")
        positions_tree.heading("Designation", text="Designation")
        
        positions_tree.column("Sr", width=80)
        positions_tree.column("CIN", width=200)
        positions_tree.column("Company", width=400)
        positions_tree.column("Designation", width=200)
        
        for i, position in enumerate(director["positions"], 1):
            positions_tree.insert("", tk.END, values=(
                i,
                position["cin"],
                position["company_name"],
                position["designation"]
            ))
            
        positions_tree.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        ttk.Label(info_frame, text=f"Created: {director.get('created_date', 'Unknown')}").pack(anchor=tk.W)
        
    def delete_director(self):
        selection = self.tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "Please select a director")
            return
            
        item = self.tree.item(selection[0])
        director_index = int(item['tags'][0])
        director_name = self.directors[director_index]["name"]
        
        if messagebox.askyesno("Confirm Delete", f"Are you sure you want to delete '{director_name}'?"):
            del self.directors[director_index]
            self.save_data()
            self.refresh_treeview()
            messagebox.showinfo("Success", "Director deleted successfully!")
            
    def download_json(self):
        if not self.directors:
            messagebox.showwarning("Warning", "No directors to download")
            return
            
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initialfile=f"directors_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(self.directors, f, indent=2, ensure_ascii=False)
                messagebox.showinfo("Success", f"Data exported successfully to {file_path}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to export data: {str(e)}")
                
    def save_data(self):
        try:
            with open('directors_data.json', 'w', encoding='utf-8') as f:
                json.dump(self.directors, f, indent=2, ensure_ascii=False)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save data: {str(e)}")
            
    def load_data(self):
        try:
            if os.path.exists('directors_data.json'):
                with open('directors_data.json', 'r', encoding='utf-8') as f:
                    self.directors = json.load(f)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load data: {str(e)}")
            self.directors = []
            
    def load_data_file(self):
        file_path = filedialog.askopenfilename(
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    loaded_data = json.load(f)
                    
                if isinstance(loaded_data, list):
                    self.directors = loaded_data
                    self.save_data()
                    self.refresh_treeview()
                    messagebox.showinfo("Success", "Data loaded successfully!")
                else:
                    messagebox.showerror("Error", "Invalid JSON format. Expected a list of directors.")
                    
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load data: {str(e)}")

def main():
    root = tk.Tk()
    app = DirectorCompanyManager(root)
    
    # Add sample data for HEMANT KHATRI
    sample_director = {
        "name": "HEMANT KHATRI",
        "din": "07768750",
        "positions": [
            {
                "cin": "U74899AP1952GOI076711",
                "company_name": "HINDUSTAN SHIPYARD LIMITED",
                "designation": "Managing Director"
            },
            {
                "cin": "U61100MH1975NPL018244",
                "company_name": "INDIAN REGISTER OF SHIPPING",
                "designation": "Director"
            },
            {
                "cin": "U61100MH1975NPL018244",
                "company_name": "INDIAN REGISTER OF SHIPPING",
                "designation": "Additional Director"
            },
            {
                "cin": "U74899AP1952GOI076711",
                "company_name": "HINDUSTAN SHIPYARD LIMITED",
                "designation": "Whole-time director"
            }
        ],
        "created_date": datetime.now().isoformat()
    }
    
    # Add sample data if no existing data
    if not app.directors:
        app.directors.append(sample_director)
        app.save_data()
        app.refresh_treeview()
    
    root.mainloop()

if __name__ == "__main__":
    main()