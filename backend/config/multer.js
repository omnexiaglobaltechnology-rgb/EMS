const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('[multer] Created uploads directory:', uploadDir);
}

// If AWS S3 env is configured, attempt to use multer-s3. Otherwise use local disk storage.
let upload;
try {
  const multer = require('multer');
  console.log('[multer] Multer module loaded successfully');

  const useS3 = process.env.AWS_S3_BUCKET && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  
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
          metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
          key: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
        }),
        limits: { fileSize: 50 * 1024 * 1024 } // 50MB
      });
    } catch (s3err) {
      console.log('[multer] S3 setup failed, falling back to disk storage:', s3err.message);
      // If multer-s3 or aws-sdk not installed, fall back to disk storage
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          console.log('[multer] Destination callback for file:', file.originalname);
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
          console.log('[multer] Generated filename:', filename);
          cb(null, filename);
        }
      });
      upload = multer({ 
        storage,
        limits: { fileSize: 50 * 1024 * 1024 } // 50MB
      });
    }
  } else {
    console.log('[multer] Using local disk storage at:', uploadDir);
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        console.log('[multer] Destination for file:', file.originalname);
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        console.log('[multer] Generated filename:', filename);
        cb(null, filename);
      }
    });
    upload = multer({ 
      storage,
      limits: { fileSize: 50 * 1024 * 1024 } // 50MB
    });
  }
} catch (err) {
  console.error('[multer] FATAL ERROR:', err.message);
  // Final fallback when multer isn't installed (development without npm install)
  upload = {
    single: () => (req, res, next) => {
      console.error('[multer] Fallback: multer not available');
      next();
    },
    array: () => (req, res, next) => {
      console.error('[multer] Fallback: multer not available');
      next();
    }
  };
}

module.exports = upload;
