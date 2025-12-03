const axios = require('axios');
const FormData = require('form-data');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function generateWithStability(prompt) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error('Missing STABILITY_API_KEY');
  const url = 'https://api.stability.ai/v1/generation/text-to-image';
  try {
    const payload = { prompt, width: 1024, height: 512, steps: 30 };
    const response = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    // Expect image as base64 or URL depending on API
    const { image_base64 } = response.data || {};
    if (!image_base64) throw new Error('No image returned');
    return Buffer.from(image_base64, 'base64');
  } catch (err) {
    throw new Error('Stability AI generation failed: ' + err.message);
  }
}

async function uploadToCloudinary(buffer, brandName) {
  const result = await cloudinary.uploader.upload(`data:image/png;base64,${buffer.toString('base64')}`, {
    folder: `bigness/${brandName}`,
    overwrite: true
  });
  return { url: result.secure_url, publicId: result.public_id };
}

async function generateAndUpload(copyText, brandName, style) {
  const prompt = `${brandName} ${style} social graphic: ${copyText}`;
  try {
    const buffer = await generateWithStability(prompt);
    return await uploadToCloudinary(buffer, brandName);
  } catch (err) {
    // Fallback: create simple placeholder via Cloudinary using text overlay
    const overlayText = encodeURIComponent(`${brandName} | ${style}`);
    const placeholderUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_1200,h_630,c_fit/co_white,l_text:Arial_40_bold:${overlayText}/bigness_placeholder.png`;
    // Upload placeholder by fetching and reuploading
    const resp = await axios.get(placeholderUrl, { responseType: 'arraybuffer' }).catch(() => null);
    const buffer = resp ? Buffer.from(resp.data) : Buffer.from('');
    if (buffer.length) {
      return await uploadToCloudinary(buffer, brandName);
    }
    // Final fallback: return placeholder link without Cloudinary upload
    return { url: placeholderUrl, publicId: null };
  }
}

module.exports = { generateAndUpload };
