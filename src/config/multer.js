const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const aws = require('aws-sdk');

const multerS3 = require('multer-s3');
const FirebaseStorage = require('multer-firebase-storage');

const storageTypes = {
  local: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, '..', '..', 'temp', 'uploads'));
    },
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);

        file.key = `${hash.toString('hex')}-${file.originalname}`;

        cb(null, file.key);
      });
    },
  }),
  firebaseStorage: FirebaseStorage({
    bucketName: process.env.FIREBASE_STORAGE_BUCKET,
    credentials: {
      clientEmail: process.env.FIREBASE_STORAGE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_STORAGE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      projectId: process.env.FIREBASE_STORAGE_PROJECT_ID
    },
    public: true,
    namePrefix: `${crypto.randomBytes(16).toString('hex')}-`,
  }),
  s3: multerS3({
    s3: new aws.S3(),
    bucket: 'upload',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    key: (req, file, cb) => {
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);

        const fileName = `${hash.toString('hex')}-${file.originalname}`;

        cb(null, fileName);
      });
    },
  })
}

module.exports = {
  dest: path.resolve(__dirname, '..', '..', 'temp', 'uploads'),
  storage: storageTypes[process.env.STORAGE_TYPE],
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/gif"
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("invalid file type"));
    }
  }
};