import "dotenv/config";

import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes.js";
import { connectDB } from "./lib/db.js";
import ingestionRoutes from "./routes/ingestionRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", (req, res) => {
  res.send("Server working");
});
app.use("/api", uploadRoutes);
app.use("/api", ingestionRoutes);
app.use("/api", queryRoutes);

// MongoDB Connection
connectDB();

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});