// upload.js
const multer = require("multer");

// Define storage for uploaded files
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
