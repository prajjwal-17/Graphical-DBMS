// routes/graph.routes.js
const express = require("express");
const router = express.Router();
const { testConnection } = require("../controllers/graph.controller");

router.get("/test", testConnection);

module.exports = router;
