const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const { getStorage, ref, deleteObject,  } = require('firebase/storage');
const { initializeApp } = require('firebase/app');

const aws = require('aws-sdk');
const { promisify } = require('util');

const s3 = new aws.S3();
const firebaseProject = initializeApp({
  apiKey: process.env.FIREBASE_STORAGE_PRIVATE_KEY,
  appId: process.env.FIREBASE_STORAGE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const PostSchema = new mongoose.Schema({
  name: String,
  size: Number,
  key: String,
  url: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

PostSchema.pre('save', function() {
  if (!this.url) {
    this.url = `${process.env.APP_URL}/files/${this.key}`;
  }
});

PostSchema.pre('remove', function() {
  if (process.env.STORAGE_TYPE === 'firebaseStorage') {
    const storage = getStorage(firebaseProject, process.env.FIREBASE_STORAGE_BUCKET);

    const fileRef = ref(storage, this.key);

    return deleteObject(fileRef)
    .then((response) => {
      console.log(response.status);
    })
    .catch((response) => {
      console.log(response.status);
    })
  }
  else if (process.env.STORAGE_TYPE === 's3') {
    return s3.deleteObject({
      Bucket: 'upload',
      key: this.key,
    })
    .promise()
    .then(response => {
      console.log(response.status);
    })
    .catch(response => {
      console.log(response.status);
    });
  } else {
    return promisify(fs.unlink)(
      path.resolve(__dirname, '..', '..', 'temp', 'uploads', this.key)
    )
  }
});

module.exports = mongoose.model("Post", PostSchema);