import cron from 'node-cron';
import { fetchTrendsFromSources } from '../services/trends.js';
import { syncEngagementForUser } from './engagement.js';
import { User } from '../schema/user.js';
import { trainWeeklyPolicies } from './rl.js';

export function startJobs() {
  // Every 15 minutes: prefetch tech and business trends
  cron.schedule('*/15 * * * *', async () => {
    try {
      const categories = ['technology', 'business'];
      for (const category of categories) {
        await fetchTrendsFromSources({ category, refresh: true });
      }
    } catch (e) {
      // Best-effort cache; swallow errors
    }
  }, { timezone: 'UTC' });

  // Every 4 hours: engagement sync
  cron.schedule('0 */4 * * *', async () => {
    try {
      const users = await User.find({}, '_id');
      for (const u of users) {
        await syncEngagementForUser(u._id);
      }
    } catch {}
  }, { timezone: 'UTC' });

  // Weekly RL training (Sunday 00:00 UTC)
  cron.schedule('0 0 * * 0', async () => {
    try { await trainWeeklyPolicies(); } catch {}
  }, { timezone: 'UTC' });
}
