import "dotenv/config";

import express from "express";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes.js";
import { connectDB } from "./lib/db.js";
import ingestionRoutes from "./routes/ingestionRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://clinicaltrailsintelligentsystembackend-production.up.railway.app',
      'https://clinical-trails-intelligent-system.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined values

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get("/test", (req, res) => {
  res.send("Server working");
});
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", ingestionRoutes);
app.use("/api", queryRoutes);
app.use("/api/chat", chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON Parse Error:', err.message);
    console.error('❌ Request headers:', req.headers);
    console.error('❌ Raw body preview:', req.body ? JSON.stringify(req.body).substring(0, 200) : 'No body');
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

const startServer = async () => {
  try {
    await connectDB();   
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();