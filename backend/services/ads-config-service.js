const { AdsConfig } = require('../models');

class AdsConfigService {
  // Save Meta credentials
  async saveMetaConfig(userId, metaData) {
    try {
      let config = await AdsConfig.findOne({ userId });
      
      if (!config) {
        config = new AdsConfig({ userId });
      }

      config.meta = {
        isConnected: true,
        accessToken: metaData.accessToken,
        businessAccountId: metaData.businessAccountId,
        adAccountId: metaData.adAccountId,
        connectedAt: new Date()
      };

      await config.save();
      return config;
    } catch (error) {
      console.error('Save Meta Config Error:', error.message);
      throw error;
    }
  }

  // Save Google credentials
  async saveGoogleConfig(userId, googleData) {
    try {
      let config = await AdsConfig.findOne({ userId });
      
      if (!config) {
        config = new AdsConfig({ userId });
      }

      config.google = {
        isConnected: true,
        accessToken: googleData.accessToken,
        refreshToken: googleData.refreshToken,
        customerId: googleData.customerId,
        connectedAt: new Date()
      };

      await config.save();
      return config;
    } catch (error) {
      console.error('Save Google Config Error:', error.message);
      throw error;
    }
  }

  // Get user's ads config
  async getConfig(userId) {
    try {
      const config = await AdsConfig.findOne({ userId });
      return config || { userId, meta: { isConnected: false }, google: { isConnected: false } };
    } catch (error) {
      console.error('Get Config Error:', error.message);
      throw error;
    }
  }

  // Check if user has Meta connected
  async hasMetaConnected(userId) {
    const config = await this.getConfig(userId);
    return config.meta?.isConnected || false;
  }

  // Check if user has Google connected
  async hasGoogleConnected(userId) {
    const config = await this.getConfig(userId);
    return config.google?.isConnected || false;
  }
}

module.exports = new AdsConfigService();
