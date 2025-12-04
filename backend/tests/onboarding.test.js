const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';
let userId = '';

async function testOnboarding() {
  try {
    // 1. Register a new user
    console.log('\n📝 Registering user...');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      email: `brand-${Date.now()}@test.com`,
      password: 'password123',
    });
    authToken = registerRes.data.token;
    userId = registerRes.data.user._id;
    console.log('✓ User registered:', userId);

    // 2. Submit brand onboarding
    console.log('\n🏢 Submitting brand onboarding...');
    const brandRes = await axios.post(
      `${API_BASE}/onboarding/brand`,
      {
        brandName: 'TechCorp',
        industry: 'Technology',
        targetAudience: 'Tech professionals aged 25-40',
        voiceTone: 'Professional',
        socialPlatforms: ['Twitter', 'LinkedIn'],
        websiteUrl: 'https://techcorp.com',
        description: 'Leading tech solutions provider',
        mainGoal: 'awareness',
        challenges: ['Consistency in posting', 'Finding content ideas'],
        monthlySocialBudget: 50000,
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✓ Brand profile saved:', brandRes.data.brandProfile._id);

    // 3. Get brand profile
    console.log('\n📖 Fetching brand profile...');
    const getRes = await axios.get(`${API_BASE}/onboarding/brand`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('✓ Brand profile retrieved');
    console.log('  - Brand Name:', getRes.data.brandProfile.brandName);
    console.log('  - Industry:', getRes.data.brandProfile.industry);
    console.log('  - Platforms:', getRes.data.brandProfile.socialPlatforms);

    // 4. Update brand profile
    console.log('\n✏️ Updating brand profile...');
    const updateRes = await axios.put(
      `${API_BASE}/onboarding/brand`,
      {
        monthlySocialBudget: 75000,
        challenges: ['Time constraints', 'Audience engagement'],
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✓ Brand profile updated');
    console.log('  - New Budget:', updateRes.data.brandProfile.monthlySocialBudget);

    // 5. Check onboarding status
    console.log('\n📊 Checking onboarding status...');
    const statusRes = await axios.get(`${API_BASE}/onboarding/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('✓ Status retrieved');
    console.log('  - Onboarding Complete:', statusRes.data.onboardingComplete);
    console.log('  - User Type:', statusRes.data.userType);

    console.log('\n✅ All brand onboarding tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testInfluencerOnboarding() {
  try {
    // 1. Register influencer
    console.log('\n📝 Registering influencer...');
    const registerRes = await axios.post(`${API_BASE}/auth/register`, {
      email: `influencer-${Date.now()}@test.com`,
      password: 'password123',
    });
    const token = registerRes.data.token;
    console.log('✓ Influencer registered');

    // 2. Submit influencer onboarding
    console.log('\n⭐ Submitting influencer onboarding...');
    const influencerRes = await axios.post(
      `${API_BASE}/onboarding/influencer`,
      {
        displayName: 'Sarah Tech',
        niches: ['Technology', 'Gadgets'],
        engagementRate: 8.5,
        followerCounts: {
          twitter: 50000,
          instagram: 150000,
          tiktok: 300000,
        },
        connectedPlatforms: ['twitter', 'instagram', 'tiktok'],
        bio: 'Tech enthusiast | Product reviewer | 5+ years of content creation',
        audienceDemographic: 'Gen Z (13-24)',
        collaborationTypes: ['Sponsored posts', 'Product reviews'],
        minCollaborationBudget: 10000,
        preferredContentTypes: 'Educational, entertaining, product reviews',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✓ Influencer profile saved:', influencerRes.data.influencerProfile._id);

    // 3. Get influencer profile
    console.log('\n📖 Fetching influencer profile...');
    const getRes = await axios.get(`${API_BASE}/onboarding/influencer`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('✓ Influencer profile retrieved');
    console.log('  - Display Name:', getRes.data.influencerProfile.displayName);
    console.log('  - Niches:', getRes.data.influencerProfile.niches);
    console.log('  - Total Followers:', Object.values(getRes.data.influencerProfile.followerCounts).reduce((a, b) => a + b, 0));

    console.log('\n✅ All influencer onboarding tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  await testOnboarding();
  await testInfluencerOnboarding();
}

runAllTests();
