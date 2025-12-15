import express from 'express';
import { verifyToken } from '../util/auth.js';
import { Post } from '../schema/post.js';

const router = express.Router();
router.use(verifyToken);

router.get('/:brandId', async (req, res) => {
    const { brandId } = req.params;
    const total = await Post.countDocuments({ brandId });
    const published = await Post.countDocuments({ brandId, status: 'published' });
    const drafts = await Post.countDocuments({ brandId, status: 'draft' });
    const agg = await Post.aggregate([
      { $match: { brandId } },
      { $group: {
        _id: '$platform',
        avgReward: { $avg: { $ifNull: ['$reward', 0] } },
        sumLikes: { $sum: { $ifNull: ['$engagement.likes', 0] } },
        sumComments: { $sum: { $ifNull: ['$engagement.comments', 0] } },
        sumShares: { $sum: { $ifNull: ['$engagement.shares', 0] } },
      }},
    ]);
    res.json({ total, published, drafts, byPlatform: agg });
});

export default router;
