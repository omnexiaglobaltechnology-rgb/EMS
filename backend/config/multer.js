const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('[multer] Created uploads directory:', uploadDir);
}

let upload;
try {
  const multer = require('multer');
  console.log('[multer] Multer module loaded successfully');

  const useS3 =
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY;

  if (useS3) {
    console.log('[multer] Using AWS S3 storage');
    try {
      const AWS = require('aws-sdk');
      const multerS3 = require('multer-s3');

      const s3 = new AWS.S3({ region: process.env.AWS_REGION });

      upload = multer({
        storage: multerS3({
          s3,
          bucket: process.env.AWS_S3_BUCKET,
          acl: 'private',
          metadata: (_req, file, cb) => cb(null, { fieldName: file.fieldname }),
          key: (_req, file, cb) =>
            cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
      });
    } catch (s3err) {
      console.log('[multer] S3 setup failed, falling back to disk storage:', s3err.message);
      const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
      });
      upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
    }
  } else {
    console.log('[multer] Using local disk storage at:', uploadDir);
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) =>
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
    });
    upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
  }
} catch (err) {
  console.error('[multer] FATAL ERROR:', err.message);
  upload = {
    single: () => (_req, _res, next) => {
      console.error('[multer] Fallback: multer not available');
      next();
    },
    array: () => (_req, _res, next) => {
      console.error('[multer] Fallback: multer not available');
      next();
    },
  };
}

module.exports = upload;
