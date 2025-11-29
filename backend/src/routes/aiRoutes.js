const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for temporary storage of reference images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Ensure temp directory exists
const fs = require('fs');
if (!fs.existsSync('uploads/temp')) {
  fs.mkdirSync('uploads/temp', { recursive: true });
}

router.post('/generate', authMiddleware, upload.single('image'), aiController.generateImage);

module.exports = router;
