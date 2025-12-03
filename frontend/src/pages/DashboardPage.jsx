import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { analytics, posts } from '../api/client';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, queueRes] = await Promise.all([
          analytics.getUserAnalytics(),
          posts.getQueueStats()
        ]);
        setAnalyticsData(analyticsRes.analytics);
        setQueueStats(queueRes.stats);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Published Posts</p>
            <p className="text-3xl font-bold text-secondary">{analyticsData?.overview.publishedPosts || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Drafts</p>
            <p className="text-3xl font-bold text-accent">{analyticsData?.overview.draftPosts || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Scheduled</p>
            <p className="text-3xl font-bold text-blue-600">{analyticsData?.overview.scheduledPosts || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600 text-sm">Total Engagement</p>
            <p className="text-3xl font-bold text-primary">{analyticsData?.allTime.totalEngagement || 0}</p>
          </div>
        </div>

        {/* Publishing Queue */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Publishing Queue</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-600">Active</p>
              <p className="text-2xl font-bold text-secondary">{queueStats?.active || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Waiting</p>
              <p className="text-2xl font-bold text-accent">{queueStats?.waiting || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{queueStats?.completed || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{queueStats?.failed || 0}</p>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-primary mb-4">Top Performers (Last 7 Days)</h2>
          <div className="space-y-3">
            {analyticsData?.last7Days ? (
              <>
                <p className="text-gray-600">Posts: {analyticsData.last7Days.posts}</p>
                <p className="text-gray-600">Engagement: {analyticsData.last7Days.likes} likes + {analyticsData.last7Days.retweets} retweets</p>
              </>
            ) : (
              <p className="text-gray-600">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
