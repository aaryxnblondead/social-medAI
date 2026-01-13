import express from 'express';
import { verifyToken } from '../util/auth.js';
import { Post } from '../schema/post.js';
import { Brand } from '../schema/brand.js';

const router = express.Router();
router.use(verifyToken);

router.get('/:brandId', async (req, res) => {
    try {
      const brand = await Brand.findOne({ _id: req.params.brandId, userId: req.userId });
      if (!brand) return res.status(404).json({ error: 'brand not found' });
      const scope = { brandId: brand._id, userId: brand.userId };
      const [total, published, drafts] = await Promise.all([
        Post.countDocuments(scope),
        Post.countDocuments({ ...scope, status: 'published' }),
        Post.countDocuments({ ...scope, status: 'draft' })
      ]);
      const agg = await Post.aggregate([
        { $match: scope },
        {
          $group: {
            _id: '$platform',
            avgReward: { $avg: { $ifNull: ['$reward', 0] } },
            sumLikes: { $sum: { $ifNull: ['$engagement.likes', 0] } },
            sumComments: { $sum: { $ifNull: ['$engagement.comments', 0] } },
            sumShares: { $sum: { $ifNull: ['$engagement.shares', 0] } },
          }
        }
      ]);
      res.json({ total, published, drafts, byPlatform: agg });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
});

export default router;
