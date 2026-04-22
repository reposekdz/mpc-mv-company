const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');

// Configure AWS S3 (fallback to local disk)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const storage = s3 ? multer.memoryStorage() : multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/reports/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDF, DOCX, images, videos for reports
  if (file.mimetype === 'application/pdf' || 
      file.mimetype.match(/image\/.*/) || 
      file.mimetype.match(/video\/.*/) ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const limits = {
  fileSize: 50 * 1024 * 1024, // 50MB
  files: 10
};

const upload = multer({ 
  storage,
  fileFilter,
  limits
});

const uploadToS3 = async (file) => {
  if (!s3) return file.path;
  
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `reports/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

module.exports = { upload, uploadToS3 };

