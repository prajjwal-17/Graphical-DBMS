const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const driver = require("../config/neo4j"); // we will make this next

const createUser = async (username, password, role = "user") => {
  const session = driver.session();
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  const query = `
    CREATE (u:User {id: $id, username: $username, password: $password, role: $role})
    RETURN u
  `;

  const params = { id: userId, username, password: hashedPassword, role };

  try {
    const result = await session.run(query, params);
    return result.records[0].get("u").properties;
  } finally {
    await session.close();
  }
};

const findUserByUsername = async (username) => {
  const session = driver.session();

  const query = `
    MATCH (u:User {username: $username})
    RETURN u
  `;

  try {
    const result = await session.run(query, { username });
    if (result.records.length === 0) return null;
    return result.records[0].get("u").properties;
  } finally {
    await session.close();
  }
};

module.exports = { createUser, findUserByUsername };
