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

// ============ CRITICAL: Trust proxy FIRST ============
app.set('trust proxy', 1);

// ============ CRITICAL: CORS MUST be applied FIRST before any routes ============
const corsOptions = {
  origin: function (origin, callback) {
    // For debugging: log all incoming origins
    console.log(`📨 Incoming request from origin: ${origin || 'NO ORIGIN (same-origin)'}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'https://clinicaltrailsintelligentsystembackend-production.up.railway.app',
      'https://clinical-trails-intelligent-system.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS approved for: ${origin}`);
      return callback(null, true);
    } else {
      console.warn(`⚠️  CORS request from unknown origin: ${origin}`);
      // IMPORTANT: Still return true to allow for debugging, but log it
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-JSON-Response', 'Authorization'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware IMMEDIATELY after trust proxy
app.use(cors(corsOptions));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============ HEALTH CHECK ENDPOINTS (no DB required) ============
app.get("/test", (req, res) => {
  res.json({ 
    status: "ok",
    message: "Server working",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    message: "Backend is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============ API ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/api", ingestionRoutes);
app.use("/api", queryRoutes);
app.use("/api/chat", chatRoutes);

// ============ Global Error Handler (must be last) ============
app.use((err, req, res, next) => {
  console.error('❌ Global error handler caught:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ============ SERVER STARTUP ============
const startServer = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Clinical Trails Intelligence System - Backend Starting');
    console.log('='.repeat(60) + '\n');

    // Check environment variables
    console.log('🔍 [STEP 1] Checking environment variables...');
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingVars.length > 0) {
      console.error(`❌ CRITICAL: Missing required environment variables: ${missingVars.join(', ')}`);
      console.error('⚠️  Setting dummy values for now - Login will fail without real values');
      // Don't exit - allow server to start for health checks
    } else {
      console.log('✅ All required environment variables present');
    }

    // Attempt MongoDB connection (non-blocking with timeout)
    console.log('\n📡 [STEP 2] Attempting MongoDB connection...');
    try {
      const connectPromise = connectDB();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      console.log('✅ MongoDB connected successfully');
    } catch (dbError) {
      console.warn(`⚠️  MongoDB connection warning: ${dbError.message}`);
      console.warn('⚠️  Server will start but auth endpoints will fail');
      console.warn('⚠️  Make sure MongoDB connection string is valid');
    }

    // Start server
    console.log('\n📋 [STEP 3] Starting Express server...');
    const PORT = process.env.PORT;

    console.log("🚀 Using PORT:", PORT);
    
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Server is now listening on port ${PORT}`);
      console.log(`✅ CORS is enabled and configured`);
      console.log(`✅ All middleware initialized`);
      console.log('\n' + '='.repeat(60));
      console.log('🎉 Backend is ready to accept requests!');
      console.log('='.repeat(60) + '\n');
      
      // Log available endpoints
      console.log('📍 Available endpoints:');
      console.log(`   - GET  /health`);
      console.log(`   - GET  /test`);
      console.log(`   - POST /api/auth/login`);
      console.log(`   - POST /api/auth/register`);
      console.log('\n');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n📛 SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('\n❌ CRITICAL SERVER STARTUP ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    console.error('\n⚠️  Server will still attempt to start for health checks');
    
    // Attempt to at least start the server without DB
    try {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`⚠️  Server started in degraded mode on port ${PORT}`);
        console.log('⚠️  Auth endpoints may not work');
      });
    } catch (fallbackError) {
      console.error('❌ FATAL: Could not start server:', fallbackError.message);
      process.exit(1);
    }
  }
};

// ============ PROCESS ERROR HANDLERS ============
process.on('uncaughtException', (err) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
  // Don't exit - let the server keep running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION:', {
    reason: reason,
    promise: promise,
    timestamp: new Date().toISOString()
  });
  // Don't exit - let the server keep running
});

// Start the server
startServer();
