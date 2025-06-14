from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

uri = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(uri, auth=(username, password))

def clear_database(tx):
    tx.run("MATCH (n) DETACH DELETE n")

if __name__ == "__main__":
    with driver.session() as session:
        session.write_transaction(clear_database)
    driver.close()
    print("🧹 All data deleted from Neo4j database.")
