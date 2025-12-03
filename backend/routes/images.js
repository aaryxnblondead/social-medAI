const express = require('express');
const { GeneratedPost, BrandProfile } = require('../models');
const imageGenerator = require('../services/image-generator');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Generate image for post (protected)
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { postId, style } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    // Get post
    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    }).populate('brandProfileId');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get brand
    const brand = await BrandProfile.findById(post.brandProfileId);
    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Generate and upload image
    const imageResult = await imageGenerator.generateAndUpload(
      post.copy,
      brand.brandName,
      style || 'professional'
    );

    // Update post with image
    post.imageUrl = imageResult.url;
    post.imagePublicId = imageResult.publicId;
    await post.save();

    res.json({
      message: 'Image generated and uploaded successfully',
      image: imageResult,
      post
    });
  } catch (error) {
    console.error('Generate Image Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Generate image for multiple posts (batch)
router.post('/generate-batch', verifyToken, async (req, res) => {
  try {
    const { postIds, style } = req.body;

    if (!postIds || postIds.length === 0) {
      return res.status(400).json({ error: 'Post IDs array is required' });
    }

    const results = [];

    for (const postId of postIds) {
      try {
        // Get post
        const post = await GeneratedPost.findOne({
          _id: postId,
          userId: req.userId
        }).populate('brandProfileId');

        if (!post) {
          results.push({
            postId,
            status: 'failed',
            error: 'Post not found'
          });
          continue;
        }

        // Get brand
        const brand = await BrandProfile.findById(post.brandProfileId);
        if (!brand) {
          results.push({
            postId,
            status: 'failed',
            error: 'Brand not found'
          });
          continue;
        }

        // Generate and upload
        const imageResult = await imageGenerator.generateAndUpload(
          post.copy,
          brand.brandName,
          style || 'professional'
        );

        // Update post
        post.imageUrl = imageResult.url;
        post.imagePublicId = imageResult.publicId;
        await post.save();

        results.push({
          postId,
          status: 'success',
          image: imageResult
        });
      } catch (error) {
        results.push({
          postId,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Batch image generation completed',
      results
    });
  } catch (error) {
    console.error('Batch Generate Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete image from Cloudinary
router.delete('/delete/:publicId', verifyToken, async (req, res) => {
  try {
    const { publicId } = req.params;

    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      // Update post to remove image
      await GeneratedPost.findOneAndUpdate(
        { imagePublicId: publicId, userId: req.userId },
        { imageUrl: null, imagePublicId: null }
      );

      res.json({
        message: 'Image deleted successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to delete image' });
    }
  } catch (error) {
    console.error('Delete Image Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
