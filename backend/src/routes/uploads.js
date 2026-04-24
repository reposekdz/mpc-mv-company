const express = require('express');
const path = require('path');
const fs = require('fs');
const { upload, getFileUrl } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const { apiResponse, apiError } = require('../utils/apiFeatures');

const router = express.Router();

router.use(authenticateToken);

// POST /api/uploads — accept up to 5 files (any field name "files" or "file")
// Returns: [{ url, originalName, size, mimeType, uploadedAt }]
router.post('/', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    // Try single file field name "file"
    return apiError(res, 'No files uploaded. Use the "files" field (multipart/form-data).', 400);
  }
  const result = req.files.map((f) => ({
    url: getFileUrl(f),
    originalName: f.originalname,
    filename: f.filename,
    size: f.size,
    mimeType: f.mimetype,
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.user?.name || null,
  }));
  return apiResponse(res, result, {}, 201);
});

// DELETE /api/uploads/:filename — admin/owner can remove an uploaded file
router.delete('/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(__dirname, '../../uploads/reports', filename);
  if (!fs.existsSync(filePath)) return apiError(res, 'File not found', 404);
  try {
    fs.unlinkSync(filePath);
    return apiResponse(res, { message: 'File deleted', filename });
  } catch (err) {
    return apiError(res, err.message, 500);
  }
});

module.exports = router;
