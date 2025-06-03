from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

# Load .env file variables
load_dotenv()

# Fetch credentials from environment variables
uri = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")

driver = GraphDatabase.driver(uri, auth=(username, password))

def test_connection():
    with driver.session() as session:
        result = session.run("RETURN 'Connected to Aura Neo4j!' AS message")
        for record in result:
            print(record["message"])

test_connection()
driver.close()
