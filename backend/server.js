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

// Trust proxy headers (required when behind Railway/Vercel/nginx)
app.set('trust proxy', 1);

// CORS configuration - MUST be before routes
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
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`⚠️  CORS blocked origin: ${origin}`);
      return callback(null, true); // Still allow, but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-JSON-Response'],
  maxAge: 3600,
  optionsSuccessStatus: 200
};

// Apply CORS globally (handles all methods including OPTIONS)
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get("/test", (req, res) => {
  res.json({ 
    status: "ok",
    message: "Server working",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    message: "Backend is running",
    timestamp: new Date().toISOString()
  });
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
    console.log('🔍 Checking environment variables...');
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
      process.exit(1);
    }
    
    console.log('✅ All required environment variables present');
    console.log('📡 Attempting to connect to MongoDB...');
    
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`✅ Server is ready to accept requests`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    process.exit(1);
  }
};

// Handle uncaught errors to prevent container crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
