import { describe, it, expect, vi } from 'vitest';
import { generateChunk } from '../../src/generators/content-generator.js';

const section = { id: 'test_section', label: 'Test', description: 'A test section' };
const branding = { primaryColor: '#000', secondaryColor: '#fff', footerText: 'Brand' };
const base = { model: 'gpt-4', temperature: 0.7, section, chunkIndex: 0, totalChunks: 1, branding };

const openaiClient = (content = 'From OpenAI') => ({
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{ message: { content } }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    },
  },
});

describe('generateChunk, c0mpute first', () => {
  it('uses c0mpute and never calls OpenAI when c0mpute answers', async () => {
    const c0mpute = {
      generateText: vi.fn().mockResolvedValue({
        text: 'From c0mpute',
        provider: 'c0mpute',
        usage: { inputTokens: 10, outputTokens: 20 },
      }),
    };
    const client = openaiClient();
    const r = await generateChunk(client, { ...base, c0mpute });
    expect(r).toEqual({
      content: 'From c0mpute',
      provider: 'c0mpute',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    });
    expect(client.chat.completions.create).not.toHaveBeenCalled();
  });

  it('works with no OpenAI client', async () => {
    const c0mpute = {
      generateText: vi.fn().mockResolvedValue({ text: 'ok', provider: 'c0mpute' }),
    };
    const r = await generateChunk(null, { ...base, c0mpute });
    expect(r.content).toBe('ok');
  });

  it('falls back to OpenAI when c0mpute fails', async () => {
    const c0mpute = { generateText: vi.fn().mockRejectedValue(new Error('no node')) };
    const r = await generateChunk(openaiClient(), { ...base, c0mpute });
    expect(r.content).toBe('From OpenAI');
    expect(r.provider).toBe('openai');
  });

  it('throws when c0mpute fails and there is no OpenAI client', async () => {
    const c0mpute = { generateText: vi.fn().mockRejectedValue(new Error('no node')) };
    await expect(generateChunk(null, { ...base, c0mpute })).rejects.toThrow('no node');
  });
});
