const neo4j = require("neo4j-driver");
require("dotenv").config(); // to read .env file

const driver = neo4j.driver(
  process.env.NEO4J_URI,              // e.g., bolt://localhost:7687
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,       // usually neo4j
    process.env.NEO4J_PASSWORD        // your password
  )
);

module.exports = driver;
