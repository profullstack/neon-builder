/**
 * Content generation module: c0mpute first (see ./c0mpute.js), then the
 * OpenAI API with retry logic when c0mpute fails and a client is set.
 */

import OpenAI from 'openai';
import { getSectionById } from '../config/sections.js';
import { createC0mpute } from './c0mpute.js';

/** Default whole-call c0mpute timeout for one chunk (30 min; up to 4000 tokens at a few tokens a second). */
export const C0MPUTE_CHUNK_TIMEOUT_MS = 30 * 60_000;

const SYSTEM_PROMPT =
  'You are an expert content creator specializing in digital products, marketing copy, and professional documentation. Your output is always polished, professional, and ready for commercial use.';

/**
 * Create an OpenAI client instance
 * @param {string} apiKey - OpenAI API key
 * @returns {OpenAI} OpenAI client instance
 */
export const createOpenAIClient = (apiKey) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
  }
  return new OpenAI({ apiKey });
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build the prompt for content generation
 * @param {Object} section - Section configuration
 * @param {number} chunkIndex - Current chunk index (0-based)
 * @param {number} totalChunks - Total number of chunks
 * @param {Object} branding - Branding configuration
 * @returns {string} Generated prompt
 */
export const buildPrompt = (section, chunkIndex, totalChunks, branding) => {
  const basePrompt = section.promptTemplate || section.description;

  return `You are generating part ${chunkIndex + 1} of ${totalChunks}
for the "${section.label}" section of a commercial digital product bundle.

SECTION ID: ${section.id}
SECTION DESCRIPTION: ${section.description}

SPECIFIC INSTRUCTIONS:
${basePrompt}

BRANDING CONTEXT:
- Primary color: ${branding.primaryColor}
- Secondary color: ${branding.secondaryColor}
- Brand name from footer: ${branding.footerText}

REQUIREMENTS:
1. Generate professional, polished, commercial-quality content
2. Content should be immediately usable without editing
3. No meta commentary or explanations about what you're generating
4. No placeholder text - all content must be complete
5. Maintain consistent tone and style throughout
6. This is chunk ${chunkIndex + 1} of ${totalChunks}, so ensure content is unique and doesn't repeat previous chunks

OUTPUT FORMAT:
Provide the content directly, formatted appropriately for the section type.
For prompts: Use numbered lists with clear categories
For copy: Use proper headings, subheadings, and formatting
For documentation: Use markdown formatting`;
};

/**
 * Generate content for a single chunk: c0mpute first, then OpenAI with retry logic
 * @param {OpenAI|null} client - OpenAI client instance (fallback; may be null when c0mpute is on)
 * @param {Object} options - Generation options
 * @param {string} options.model - Model name
 * @param {number} options.temperature - Generation temperature
 * @param {number} options.maxTokens - Maximum tokens
 * @param {Object} options.section - Section configuration
 * @param {number} options.chunkIndex - Current chunk index
 * @param {number} options.totalChunks - Total chunks for section
 * @param {Object} options.branding - Branding configuration
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {number} options.retryDelay - Delay between retries in ms
 * @param {Object|null} [options.c0mpute] - c0mpute router; default from env, null skips c0mpute
 * @returns {Promise<{content: string, provider?: string, usage: {promptTokens: number, completionTokens: number, totalTokens: number}}>} Generated content with token usage
 */
export const generateChunk = async (client, options) => {
  const {
    model,
    temperature,
    maxTokens = 4000,
    section,
    chunkIndex,
    totalChunks,
    branding,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;
  const c0mpute =
    options.c0mpute === undefined
      ? createC0mpute({ defaultTimeoutMs: C0MPUTE_CHUNK_TIMEOUT_MS })
      : options.c0mpute;

  const prompt = buildPrompt(section, chunkIndex, totalChunks, branding);

  if (c0mpute) {
    try {
      const r = await c0mpute.generateText({
        system: SYSTEM_PROMPT,
        user: prompt,
        temperature,
        maxTokens,
        feature: `neon-builder:${section.id}`,
      });
      if (!r.text?.trim()) throw new Error('Empty response from c0mpute');
      return {
        content: r.text,
        provider: r.provider,
        usage: {
          promptTokens: r.usage?.inputTokens || 0,
          completionTokens: r.usage?.outputTokens || 0,
          totalTokens: (r.usage?.inputTokens || 0) + (r.usage?.outputTokens || 0),
        },
      };
    } catch (error) {
      if (!client) {
        throw new Error(`Failed to generate content on c0mpute: ${error.message}`);
      }
      console.warn(`c0mpute failed, falling back to OpenAI: ${error.message}`);
    }
  }

  if (!client) {
    throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }

      // Extract token usage from response
      const usage = {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      };

      return { content, provider: 'openai', usage };
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      if (error.status === 429) {
        // Rate limited - wait longer
        const waitTime = retryDelay * attempt * 2;
        console.warn(`Rate limited. Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        await sleep(waitTime);
        continue;
      }

      if (attempt < maxRetries) {
        console.warn(
          `Generation attempt ${attempt} failed: ${error.message}. Retrying in ${retryDelay}ms...`
        );
        await sleep(retryDelay * attempt);
      }
    }
  }

  throw new Error(
    `Failed to generate content after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  );
};

/**
 * Generate all chunks for a section
 * @param {OpenAI|null} client - OpenAI client instance (fallback)
 * @param {Object} options - Generation options
 * @param {string} options.sectionId - Section ID
 * @param {number} options.numChunks - Number of chunks to generate
 * @param {string} options.model - Model name
 * @param {number} options.temperature - Generation temperature
 * @param {Object} options.branding - Branding configuration
 * @param {Function} options.onProgress - Progress callback (chunkIndex, content, usage)
 * @param {Object|null} [options.c0mpute] - c0mpute router; default from env, null skips c0mpute
 * @returns {Promise<{chunks: string[], totalUsage: {promptTokens: number, completionTokens: number, totalTokens: number}}>} Array of generated content chunks with total usage
 */
export const generateSection = async (client, options) => {
  const {
    sectionId,
    numChunks,
    model,
    temperature,
    branding,
    onProgress,
    maxRetries,
    retryDelay,
    c0mpute,
  } = options;

  const section = getSectionById(sectionId);

  if (!section) {
    throw new Error(`Unknown section ID: ${sectionId}`);
  }

  const chunks = [];
  const totalUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  for (let i = 0; i < numChunks; i++) {
    const { content, usage } = await generateChunk(client, {
      model,
      temperature,
      section,
      chunkIndex: i,
      totalChunks: numChunks,
      branding,
      maxRetries,
      retryDelay,
      c0mpute,
    });

    chunks.push(content);

    // Accumulate usage
    totalUsage.promptTokens += usage.promptTokens;
    totalUsage.completionTokens += usage.completionTokens;
    totalUsage.totalTokens += usage.totalTokens;

    if (onProgress) {
      onProgress(i, content, usage);
    }
  }

  return { chunks, totalUsage };
};

/**
 * Validate API key by making a minimal API call
 * @param {string} apiKey - OpenAI API key to validate
 * @returns {Promise<boolean>} True if valid
 */
export const validateApiKey = async (apiKey) => {
  try {
    const client = createOpenAIClient(apiKey);
    await client.models.list();
    return true;
  } catch (error) {
    if (error.status === 401) {
      return false;
    }
    // Other errors might be network issues, not invalid key
    throw error;
  }
};

/**
 * Get available models from OpenAI
 * @param {OpenAI} client - OpenAI client instance
 * @returns {Promise<string[]>} Array of model IDs
 */
export const getAvailableModels = async (client) => {
  const response = await client.models.list();
  return response.data
    .filter((model) => model.id.includes('gpt'))
    .map((model) => model.id)
    .sort();
};

export default {
  createOpenAIClient,
  buildPrompt,
  generateChunk,
  generateSection,
  validateApiKey,
  getAvailableModels,
};