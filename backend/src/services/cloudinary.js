import { v2 as cloudinary } from 'cloudinary';

// Configure via CLOUDINARY_URL or individual envs
cloudinary.config({
  secure: true
});

export async function uploadBufferToCloudinary(buffer, opts = {}) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream({ resource_type: 'image', folder: opts.folder || 'bigness', ...opts }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    upload.end(buffer);
  });
}
