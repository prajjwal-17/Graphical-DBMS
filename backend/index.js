require("dotenv").config();
const express = require("express");
const cors = require("cors");
const graphRoutes = require("./routes/graph.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/graph", graphRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
