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
  fs.mkdirSync(uploadDir, { recursive: true });
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

// File filter to accept only ZIP files
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
  cb(new Error('Only ZIP files are allowed'));
};

// Initialize multer with storage, file filter, and limits
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
  fileFilter: fileFilter,
});

// Serve static files from uploads directory (optional)
app.use('/uploads', express.static('uploads'));

// Upload route
app.post('/get_transaction', upload.single('file'), (req, res) => {
  console.log('req.file', req.file);

  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Define the response as a list of transaction objects
  const transactions = [
    {
      "metadata": "00410006000001010300402200442225o38d4r1mpylet5102TH910456ED",
      "bank": "ธนาคารไทยพาณิชย์",
      "type": "expense",
      "amount": 100,
      "category_id": 2,
      "date": "2024-03-04",
      "time": "12:00:00",
      "memo": "ค่าข้าว"
    },
    {
      "metadata": "00410006000001010300402200442225o38d4iofjo1290373901", 
      "bank": "ธนาคารกสิกรไทย", 
      "type": "expense",
      "amount": 100,
      "category_id": 3,
      "date": "2024-03-04",
      "time": "12:00:00",
      "memo": "ค่ารถ" 
    },
    {
      "metadata": "00410006000001010300402200442225o38dassavaasgvbqwaba", 
      "bank": "ธนาคารกสิกรไทย", 
      "type": "expense",
      "amount": 100,
      "category_id": 4,
      "date": null,
      "time": "12:00:00",
      "memo": "ค่าเรียน" 
    },
    {
      "metadata": "00410006000001010300402200442225o38d4saf34yhg43qhserwdvb",
      "bank": "ธนาคารไทยพาณิชย์",
      "type": "expense",
      "amount": 100,
      "category_id": 2,
      "date": "2024-03-04",
      "time": null,
      "memo": "pop mart"
    },
    {
      "metadata": "00410006000001010300402200442225o38d4saf34yhg4870970SASOIhasiv",
      "bank": "ธนาคารไทยพาณิชย์",
      "type": "expense",
      "amount": 100,
      "category_id": -1,
      "date": "2024-03-04",
      "time": null,
      "memo": null
    },
  ];

  // Optionally, delete the uploaded ZIP file after responding
  fs.unlink(req.file.path, (err) => {
    if (err) {
      console.error('Error deleting uploaded ZIP file:', err);
    } else {
      console.log('Uploaded ZIP file deleted successfully.');
    }
  });

  // Respond with the list of transactions
  res.status(200).json(transactions);
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
