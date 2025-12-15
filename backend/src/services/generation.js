import axios from 'axios';
import { uploadBufferToCloudinary } from './cloudinary.js';

function buildSystemPrompt(brand) {
  return [
    `You are an assistant creating ${brand?.tone || 'professional'} social posts for ${brand?.name || 'a B2B brand'}.`,
    brand?.pillars?.length ? `Messaging pillars: ${brand.pillars.join(', ')}` : null,
    brand?.industry ? `Industry: ${brand.industry}` : null,
    brand?.audience ? `Target audience: ${brand.audience}` : null
  ].filter(Boolean).join('\n');
}

export async function generateCopyWithGroq({ brand, trend, platform }) {
  const apiKey = process.env.GROQ_API_KEY;
  const sys = buildSystemPrompt(brand);
  const user = `Platform: ${platform}. Topic: ${trend?.title || 'industry news'}. Write a concise post in the brand voice. 1-2 sentences.`;
  if (!apiKey) {
    const fallback = `(${platform}) ${brand?.name || 'Brand'}: ${trend?.title || 'Insightful note for our audience.'}`;
    return { text: fallback, model: 'fallback-no-groq-key' };
  }
  try {
    const r = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 220,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user }
      ]
    }, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const text = r.data?.choices?.[0]?.message?.content?.trim();
    return { text: text || user, model: r.data?.model || 'groq-mixtral' };
  } catch (e) {
    const fallback = `(${platform}) ${brand?.name || 'Brand'}: ${trend?.title || 'Insightful note for our audience.'}`;
    return { text: fallback, model: 'fallback-groq-error' };
  }
}

function buildImagePrompt({ brand, copy }) {
  const parts = [
    `Professional social graphic for ${brand?.name || 'a B2B brand'}`,
    brand?.tone ? `Tone: ${brand.tone}` : null,
    brand?.colors?.length ? `Brand colors: ${brand.colors.join(', ')}` : null,
    copy ? `Inspiration: ${copy}` : null,
  ].filter(Boolean);
  return parts.join('. ');
}

export async function generateImageWithStability({ brand, copy }) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return { url: null, provider: 'stability-missing-key' };
  try {
    const prompt = buildImagePrompt({ brand, copy });
    const r = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image',
      {
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        clip_guidance_preset: 'FAST_BLUE',
        height: 512,
        width: 512,
        samples: 1,
        steps: 25
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const b64 = r.data?.artifacts?.[0]?.base64;
    if (!b64) return { url: null, provider: 'stability-no-artifact' };
    const buffer = Buffer.from(b64, 'base64');
    const uploaded = await uploadBufferToCloudinary(buffer, { folder: 'bigness/generated' });
    return { url: uploaded?.secure_url || uploaded?.url || null, provider: 'stability+cloudinary' };
  } catch (e) {
    return { url: null, provider: 'stability-error' };
  }
}
