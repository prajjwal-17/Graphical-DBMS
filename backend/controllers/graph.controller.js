// controllers/graph.controller.js
const { getSession } = require("../services/neo4j.service");

const testConnection = async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run("RETURN 'Neo4j connection successful' AS message");
    res.json({ success: true, message: result.records[0].get("message") });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await session.close();
  }
};

module.exports = { testConnection };
