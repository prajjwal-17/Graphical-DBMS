require("dotenv").config();
const express = require("express");
const cors = require("cors");

const graphRoutes = require("./routes/graph.routes");
const authRoutes = require("./routes/auth.routes");
const formRoutes = require("./routes/form.routes"); // New import

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/graph", graphRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/form", formRoutes); // New route

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));