const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const learningRoutes = require("./routes/learningRoutes");
const progressRoutes = require("./routes/progressRoutes");

connectDB();

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || "https://remind-ai.vercel.app"
    : "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.use("/api/users", authRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/progress", progressRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Knowledge Decay AI API is running",
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Allow sufficient time for AI operations
server.setTimeout(180000);
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
