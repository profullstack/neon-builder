/**
 * Tests for content generator module
 * Using Vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildPrompt, createOpenAIClient } from '../../src/generators/content-generator.js';

describe('Content Generator', () => {
  describe('createOpenAIClient', () => {
    it('should throw error when API key is not provided', () => {
      expect(() => createOpenAIClient()).toThrow('OpenAI API key is required');
    });

    it('should throw error when API key is empty string', () => {
      expect(() => createOpenAIClient('')).toThrow('OpenAI API key is required');
    });

    it('should throw error when API key is null', () => {
      expect(() => createOpenAIClient(null)).toThrow('OpenAI API key is required');
    });

    it('should create client when valid API key is provided', () => {
      const client = createOpenAIClient('test-api-key');
      expect(client).toBeDefined();
    });
  });

  describe('buildPrompt', () => {
    const mockSection = {
      id: 'test_section',
      label: 'Test Section',
      description: 'A test section for testing',
      promptTemplate: 'Generate test content for this section.',
    };

    const mockBranding = {
      primaryColor: '#00FFC8',
      secondaryColor: '#1a1a2e',
      footerText: '© Test Brand',
    };

    it('should include chunk information', () => {
      const prompt = buildPrompt(mockSection, 0, 5, mockBranding);
      expect(prompt).toContain('part 1 of 5');
    });

    it('should include section label', () => {
      const prompt = buildPrompt(mockSection, 0, 5, mockBranding);
      expect(prompt).toContain('Test Section');
    });

    it('should include section description', () => {
      const prompt = buildPrompt(mockSection, 0, 5, mockBranding);
      expect(prompt).toContain('A test section for testing');
    });

    it('should include prompt template', () => {
      const prompt = buildPrompt(mockSection, 0, 5, mockBranding);
      expect(prompt).toContain('Generate test content for this section');
    });

    it('should include branding colors', () => {
      const prompt = buildPrompt(mockSection, 0, 5, mockBranding);
      expect(prompt).toContain('#00FFC8');
      expect(prompt).toContain('#1a1a2e');
    });

    it('should include footer text', () => {
      const prompt = buildPrompt(mockSection, 0, 5, mockBranding);
      expect(prompt).toContain('© Test Brand');
    });

    it('should use description as fallback when no promptTemplate', () => {
      const sectionWithoutTemplate = {
        ...mockSection,
        promptTemplate: undefined,
      };
      const prompt = buildPrompt(sectionWithoutTemplate, 0, 5, mockBranding);
      expect(prompt).toContain('A test section for testing');
    });

    it('should correctly calculate chunk number (1-indexed)', () => {
      const prompt = buildPrompt(mockSection, 4, 10, mockBranding);
      expect(prompt).toContain('part 5 of 10');
    });

    it('should include section ID', () => {
      const prompt = buildPrompt(mockSection, 0, 5, mockBranding);
      expect(prompt).toContain('test_section');
    });
  });

  describe('generateChunk', () => {
    it('should be a function', async () => {
      const { generateChunk } = await import('../../src/generators/content-generator.js');
      expect(typeof generateChunk).toBe('function');
    });

    it('should return an object with content and usage properties', async () => {
      const { generateChunk } = await import('../../src/generators/content-generator.js');

      // Create a mock client
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Generated test content' } }],
              usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150,
              },
            }),
          },
        },
      };

      const mockSection = {
        id: 'test_section',
        label: 'Test Section',
        description: 'A test section',
        promptTemplate: 'Generate test content',
      };

      const mockBranding = {
        primaryColor: '#00FFC8',
        secondaryColor: '#1a1a2e',
        footerText: '© Test Brand',
      };

      const result = await generateChunk(mockClient, {
        model: 'gpt-4',
        temperature: 0.7,
        section: mockSection,
        chunkIndex: 0,
        totalChunks: 1,
        branding: mockBranding,
      });

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('usage');
      expect(result.content).toBe('Generated test content');
      expect(result.usage.promptTokens).toBe(100);
      expect(result.usage.completionTokens).toBe(50);
      expect(result.usage.totalTokens).toBe(150);
    });

    it('should handle missing usage data gracefully', async () => {
      const { generateChunk } = await import('../../src/generators/content-generator.js');

      // Create a mock client with no usage data
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Generated content' } }],
              usage: null,
            }),
          },
        },
      };

      const mockSection = {
        id: 'test_section',
        label: 'Test Section',
        description: 'A test section',
      };

      const mockBranding = {
        primaryColor: '#00FFC8',
        secondaryColor: '#1a1a2e',
        footerText: '© Test Brand',
      };

      const result = await generateChunk(mockClient, {
        model: 'gpt-4',
        temperature: 0.7,
        section: mockSection,
        chunkIndex: 0,
        totalChunks: 1,
        branding: mockBranding,
      });

      expect(result.content).toBe('Generated content');
      expect(result.usage.promptTokens).toBe(0);
      expect(result.usage.completionTokens).toBe(0);
      expect(result.usage.totalTokens).toBe(0);
    });

    it('should throw error on empty response', async () => {
      const { generateChunk } = await import('../../src/generators/content-generator.js');

      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: null } }],
            }),
          },
        },
      };

      const mockSection = {
        id: 'test_section',
        label: 'Test Section',
        description: 'A test section',
      };

      const mockBranding = {
        primaryColor: '#00FFC8',
        secondaryColor: '#1a1a2e',
        footerText: '© Test Brand',
      };

      await expect(
        generateChunk(mockClient, {
          model: 'gpt-4',
          temperature: 0.7,
          section: mockSection,
          chunkIndex: 0,
          totalChunks: 1,
          branding: mockBranding,
          maxRetries: 1,
        })
      ).rejects.toThrow('Empty response from OpenAI API');
    });
  });

  describe('generateSection', () => {
    it('should be a function', async () => {
      const { generateSection } = await import('../../src/generators/content-generator.js');
      expect(typeof generateSection).toBe('function');
    });

    it('should return chunks array and totalUsage', async () => {
      const { generateSection } = await import('../../src/generators/content-generator.js');

      // Create a mock client
      let callCount = 0;
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockImplementation(() => {
              callCount++;
              return Promise.resolve({
                choices: [{ message: { content: `Content chunk ${callCount}` } }],
                usage: {
                  prompt_tokens: 100,
                  completion_tokens: 50,
                  total_tokens: 150,
                },
              });
            }),
          },
        },
      };

      const mockBranding = {
        primaryColor: '#00FFC8',
        secondaryColor: '#1a1a2e',
        footerText: '© Test Brand',
      };

      const result = await generateSection(mockClient, {
        sectionId: 'core_prompts',
        numChunks: 3,
        model: 'gpt-4',
        temperature: 0.7,
        branding: mockBranding,
      });

      expect(result).toHaveProperty('chunks');
      expect(result).toHaveProperty('totalUsage');
      expect(result.chunks).toHaveLength(3);
      expect(result.chunks[0]).toBe('Content chunk 1');
      expect(result.chunks[1]).toBe('Content chunk 2');
      expect(result.chunks[2]).toBe('Content chunk 3');

      // Total usage should be accumulated
      expect(result.totalUsage.promptTokens).toBe(300); // 100 * 3
      expect(result.totalUsage.completionTokens).toBe(150); // 50 * 3
      expect(result.totalUsage.totalTokens).toBe(450); // 150 * 3
    });

    it('should call onProgress callback with usage data', async () => {
      const { generateSection } = await import('../../src/generators/content-generator.js');

      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Test content' } }],
              usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150,
              },
            }),
          },
        },
      };

      const mockBranding = {
        primaryColor: '#00FFC8',
        secondaryColor: '#1a1a2e',
        footerText: '© Test Brand',
      };

      const progressCalls = [];
      const onProgress = vi.fn((index, content, usage) => {
        progressCalls.push({ index, content, usage });
      });

      await generateSection(mockClient, {
        sectionId: 'core_prompts',
        numChunks: 2,
        model: 'gpt-4',
        temperature: 0.7,
        branding: mockBranding,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(progressCalls[0].index).toBe(0);
      expect(progressCalls[0].usage.promptTokens).toBe(100);
      expect(progressCalls[1].index).toBe(1);
    });

    it('should throw error for unknown section ID', async () => {
      const { generateSection } = await import('../../src/generators/content-generator.js');

      const mockClient = {};
      const mockBranding = {
        primaryColor: '#00FFC8',
        secondaryColor: '#1a1a2e',
        footerText: '© Test Brand',
      };

      await expect(
        generateSection(mockClient, {
          sectionId: 'unknown_section_xyz',
          numChunks: 1,
          model: 'gpt-4',
          temperature: 0.7,
          branding: mockBranding,
        })
      ).rejects.toThrow('Unknown section ID: unknown_section_xyz');
    });
  });

  describe('validateApiKey', () => {
    it('should be a function', async () => {
      const { validateApiKey } = await import('../../src/generators/content-generator.js');
      expect(typeof validateApiKey).toBe('function');
    });
  });

  describe('getAvailableModels', () => {
    it('should be a function', async () => {
      const { getAvailableModels } = await import('../../src/generators/content-generator.js');
      expect(typeof getAvailableModels).toBe('function');
    });
  });
});