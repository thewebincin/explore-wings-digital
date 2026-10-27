'use strict';
/**
 * File upload handler with Multer and Sharp.
 * Converts raster images to modern WebP, extracts width/height,
 * generates unique filenames, and handles enquiry attachments.
 */
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, WebP, and SVG images are allowed.'), false);
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: imageFilter
});

const docFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip'
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document type. Allowed: PDF, DOC, DOCX, ZIP, PNG, JPG.'), false);
  }
};

const uploadAttachment = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: docFilter
});

async function processUploadedImage(file, { maxWidth = 2000, quality = 85 } = {}) {
  const isSvg = file.mimetype === 'image/svg+xml';
  const randomHex = crypto.randomBytes(8).toString('hex');
  const baseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (isSvg) {
    const filename = `${baseName}_${randomHex}.svg`;
    const dest = path.join(config.uploadsDir, filename);
    fs.writeFileSync(dest, file.buffer);
    return {
      filename,
      filepath: `/uploads/${filename}`,
      mime_type: file.mimetype,
      filesize: file.size,
      width: null,
      height: null
    };
  }

  // Convert raster images to WebP
  const filename = `${baseName}_${randomHex}.webp`;
  const dest = path.join(config.uploadsDir, filename);

  const image = sharp(file.buffer);
  const metadata = await image.metadata();

  let transform = image.rotate(); // auto-orient
  if (metadata.width && metadata.width > maxWidth) {
    transform = transform.resize(maxWidth);
  }

  const outputBuffer = await transform.webp({ quality }).toBuffer();
  fs.writeFileSync(dest, outputBuffer);

  const finalMeta = await sharp(outputBuffer).metadata();

  return {
    filename,
    filepath: `/uploads/${filename}`,
    mime_type: 'image/webp',
    filesize: outputBuffer.length,
    width: finalMeta.width || null,
    height: finalMeta.height || null
  };
}

function savePrivateAttachment(file) {
  const randomHex = crypto.randomBytes(12).toString('hex');
  const ext = path.extname(file.originalname);
  const filename = `${randomHex}${ext}`;
  const dest = path.join(config.privateUploadsDir, filename);

  fs.writeFileSync(dest, file.buffer);

  return {
    filename,
    original_name: file.originalname,
    filepath: filename,
    filesize: file.size,
    mime_type: file.mimetype
  };
}

module.exports = {
  uploadImage,
  uploadAttachment,
  processUploadedImage,
  savePrivateAttachment
};
