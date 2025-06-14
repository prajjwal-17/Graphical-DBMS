// services/neo4j.service.js
const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

const getSession = () => driver.session({ database: "neo4j" });

module.exports = { driver, getSession };
