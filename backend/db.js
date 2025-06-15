require("dotenv").config();
const { ApolloServer } = require("apollo-server");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { readFileSync } = require("fs");
const neo4j = require("neo4j-driver");

// Load schema
const typeDefs = readFileSync("./schema.graphql", "utf-8");

// Neo4j connection
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

// Create GraphQL schema and start server
(async () => {
  try {
    const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

    const schema = await neoSchema.getSchema(); // ← This line can throw errors

    const server = new ApolloServer({
      schema,
      context: ({ req }) => ({ req }),
    });

    const { url } = await server.listen({ port: 4000 });
    console.log(`🚀 GraphQL ready at ${url}`);
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
})();
