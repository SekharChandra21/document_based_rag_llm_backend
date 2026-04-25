import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile, getDocuments } from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads in memory only
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedExt = [".pdf", ".csv", ".xlsx", ".jpg", ".jpeg", ".png"];
  const allowedMimeTypes = [
    "application/pdf",
    "text/csv",
    "application/csv",
    "text/comma-separated-values",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "image/jpeg",
    "image/jpg",
    "image/png"
  ];

  if (allowedExt.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, CSV, XLSX files are allowed"));
  }
}
});

// Upload route for clinical trial documents
router.post('/upload', authMiddleware, upload.single('file'), uploadFile);

router.get('/documents', authMiddleware, getDocuments);

// Multiple files upload
router.post('/upload-multiple', authMiddleware, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: files
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;