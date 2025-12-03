const Groq = require('groq-sdk');

class CopyGeneratorService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  // Generate social media copy for a trend
  async generateCopy(brand, trend, platform = 'twitter') {
    try {
      console.log(`📝 Generating ${platform} copy for ${brand.brandName}...`);

      const prompt = this.buildPrompt(brand, trend, platform);

      const message = await this.groq.messages.create({
        model: 'mixtral-8x7b-32768',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const copy = message.content[0].text;
      
      console.log(`✅ Copy generated successfully`);
      return copy;
    } catch (error) {
      console.error('❌ Copy generation error:', error.message);
      throw error;
    }
  }

  // Generate multiple copy variations
  async generateCopyVariations(brand, trend, platform = 'twitter', count = 3) {
    try {
      console.log(`📝 Generating ${count} copy variations...`);

      const variations = [];
      
      for (let i = 0; i < count; i++) {
        const copy = await this.generateCopy(brand, trend, platform);
        variations.push(copy);
      }

      return variations;
    } catch (error) {
      console.error('❌ Copy variations error:', error.message);
      throw error;
    }
  }

  // Build prompt for Groq
  buildPrompt(brand, trend, platform) {
    let platformInstructions = '';
    
    if (platform === 'twitter') {
      platformInstructions = `
        - Keep it under 280 characters
        - Use engaging hashtags (max 3)
        - Include a call-to-action
        - Make it conversational
      `;
    } else if (platform === 'linkedin') {
      platformInstructions = `
        - Keep it under 3000 characters
        - Professional tone
        - Include industry insights
        - End with a thought-provoking question
      `;
    } else if (platform === 'instagram') {
      platformInstructions = `
        - Engaging and visual language
        - Use 5-10 relevant hashtags
        - Include emojis for visual appeal
        - Create FOMO (Fear of Missing Out)
      `;
    }

    return `You are a social media copywriter for ${brand.brandName}, a ${brand.industry} company.
    
Your brand voice: ${brand.voiceTone}
Brand keywords: ${brand.keywords?.join(', ') || 'innovation, growth, technology'}
Target audience: ${brand.targetAudience}

Create engaging social media content about this trend:
Title: ${trend.title}
${trend.description ? `Description: ${trend.description}` : ''}
Source: ${trend.source}

Platform: ${platform}
${platformInstructions}

Generate ONLY the copy, no explanations. Make it authentic, engaging, and aligned with the brand voice.`;
  }
}

module.exports = new CopyGeneratorService();
