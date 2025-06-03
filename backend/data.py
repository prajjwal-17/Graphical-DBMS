from neo4j import GraphDatabase
from dotenv import load_dotenv
import os
import json

# Load environment variables from .env file
load_dotenv()

uri = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(uri, auth=(username, password))

# Load your JSON data
with open("tcs_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

def add_company_data(tx, data):
    company_name = data["company"]

    tx.run("MERGE (c:Company {name: $name})", name=company_name)

    for person in data.get("employees_key_people", []):
        tx.run("""
            MERGE (p:Person {name: $name, role: $role})
            WITH p
            MATCH (c:Company {name: $company_name})
            MERGE (p)-[:WORKS_FOR]->(c)
        """, name=person["name"], role=person["role"], company_name=company_name)

    for member in data.get("board_members_tcs_official", []):
        tx.run("""
            MERGE (b:Person {name: $name, role: $role})
            WITH b
            MATCH (c:Company {name: $company_name})
            MERGE (b)-[:BOARD_MEMBER_OF]->(c)
        """, name=member["name"], role=member["role"], company_name=company_name)

    for sub in data.get("subsidiaries", []):
        tx.run("""
            MERGE (s:Company {name: $sub_name})
            WITH s
            MATCH (c:Company {name: $company_name})
            MERGE (c)-[:OWNS]->(s)
        """, sub_name=sub, company_name=company_name)

    for acq in data.get("acquisitions", []):
        tx.run("""
            MERGE (a:Company {
                name: $name,
                activities: $activities,
                country: $country,
                price: $price,
                employees: $employees
            })
            WITH a
            MATCH (c:Company {name: $company_name})
            MERGE (c)-[:ACQUIRED {
                date: $date
            }]->(a)
        """, name=acq["Name"],
             activities=acq["Activities"],
             country=acq["Country"],
             price=acq["Price"],
             employees=acq["Employees (at acquisition)"],
             date=acq["Acquisition date"],
             company_name=company_name)

if __name__ == "__main__":
    with driver.session() as session:
        session.write_transaction(add_company_data, data)
    driver.close()
    print("✅ Data successfully added to Neo4j.")
