import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadFile} from "../controllers/uploadController.js";

const router = express.Router();

// Configure multer for file uploads in memory only
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types for clinical trials
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Upload route for clinical trial documents
router.post('/upload', upload.single('file'), uploadFile);

// Multiple files upload
router.post('/upload-multiple', upload.array('files', 10), (req, res) => {
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