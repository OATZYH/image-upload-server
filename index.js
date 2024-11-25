// index.js (Express Server)
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const unzipper = require('unzipper');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS (adjust origin as needed)
app.use(cors());

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Set up storage engine with multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: function (req, file, cb) {
    // Prepend timestamp to avoid name collisions
    cb(null, Date.now() + '-' + file.originalname);
  },
});

// File filter to accept only zip files
const fileFilter = (req, file, cb) => {
  console.log('Received file:', file.originalname);
  console.log('MIME type:', file.mimetype);
  console.log('Extension:', path.extname(file.originalname).toLowerCase());

  const allowedTypes = /zip/;
  const mimeType = allowedTypes.test(file.mimetype);
  const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  }
  cb(new Error('Only zip files are allowed'));
};

// Initialize multer with storage, file filter, and limits
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
  fileFilter: fileFilter,
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  // Log to see what request we get from frontend
  console.log('req.file', req.file);

  try {
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const zipFilePath = req.file.path;
    const extractionPath = path.join(__dirname, 'uploads', 'extracted', Date.now().toString());

    // Ensure extraction directory exists
    if (!fs.existsSync(extractionPath)) {
      fs.mkdirSync(extractionPath, { recursive: true });
    }

    // Extract the zip file
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: extractionPath }))
      .on('close', () => {
        console.log('Extraction complete');

        // Read the extracted files
        fs.readdir(extractionPath, (err, files) => {
          if (err) {
            console.error('Error reading extracted files:', err);
            return res.status(500).json({ message: 'Server error' });
          }

          // Filter image files
          const imageFiles = files.filter((file) => {
            const fileTypes = /jpeg|jpg|png|gif/;
            return fileTypes.test(path.extname(file).toLowerCase());
          });

          console.log(`${imageFiles.length} image(s) extracted.`);

          // Process the images as needed

          res.status(200).json({
            message: 'Zip file uploaded and extracted successfully',
            images: imageFiles,
          });
        });
      })
      .on('error', (err) => {
        console.error('Error during extraction:', err);
        res.status(500).json({ message: 'Error during extraction' });
      });
  } catch (error) {
    console.error('Error during file upload:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Global error handler for multer and other errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle Multer-specific errors
    console.error('Multer Error:', err.message);
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Handle other errors
    console.error('General Error:', err.message);
    return res.status(400).json({ message: err.message });
  }
  next();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
