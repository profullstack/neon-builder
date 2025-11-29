/**
 * Tests for defaults configuration module
 * Using Vitest
 */

import { describe, it, expect, afterEach } from 'vitest';
import { DEFAULT_CONFIG, mergeConfig, validateConfig, getEnvConfig } from '../../src/config/defaults.js';

describe('Defaults Configuration', () => {
  describe('DEFAULT_CONFIG constant', () => {
    it('should be an object', () => {
      expect(DEFAULT_CONFIG).toBeTypeOf('object');
    });

    it('should have rootFolder property', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('rootFolder');
      expect(typeof DEFAULT_CONFIG.rootFolder).toBe('string');
    });

    it('should have model property', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('model');
      expect(typeof DEFAULT_CONFIG.model).toBe('string');
    });

    it('should have temperature property', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('temperature');
      expect(typeof DEFAULT_CONFIG.temperature).toBe('number');
      expect(DEFAULT_CONFIG.temperature).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_CONFIG.temperature).toBeLessThanOrEqual(2);
    });

    it('should have generatePDFs property', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('generatePDFs');
      expect(typeof DEFAULT_CONFIG.generatePDFs).toBe('boolean');
    });

    it('should have branding object', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('branding');
      expect(DEFAULT_CONFIG.branding).toBeTypeOf('object');
      expect(DEFAULT_CONFIG.branding).toHaveProperty('primaryColor');
      expect(DEFAULT_CONFIG.branding).toHaveProperty('secondaryColor');
      expect(DEFAULT_CONFIG.branding).toHaveProperty('logoUrl');
      expect(DEFAULT_CONFIG.branding).toHaveProperty('footerText');
    });

    it('should have valid hex colors in branding', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      expect(DEFAULT_CONFIG.branding.primaryColor).toMatch(hexColorRegex);
      expect(DEFAULT_CONFIG.branding.secondaryColor).toMatch(hexColorRegex);
    });
  });

  describe('mergeConfig', () => {
    it('should return defaults when called with no arguments', () => {
      const config = mergeConfig();
      expect(config.rootFolder).toBe(DEFAULT_CONFIG.rootFolder);
      expect(config.model).toBe(DEFAULT_CONFIG.model);
    });

    it('should return defaults when called with empty object', () => {
      const config = mergeConfig({});
      expect(config.rootFolder).toBe(DEFAULT_CONFIG.rootFolder);
    });

    it('should override top-level properties', () => {
      const config = mergeConfig({ rootFolder: 'CustomFolder' });
      expect(config.rootFolder).toBe('CustomFolder');
      expect(config.model).toBe(DEFAULT_CONFIG.model);
    });

    it('should merge branding properties', () => {
      const config = mergeConfig({
        branding: { primaryColor: '#FF0000' },
      });
      expect(config.branding.primaryColor).toBe('#FF0000');
      expect(config.branding.secondaryColor).toBe(DEFAULT_CONFIG.branding.secondaryColor);
    });

    it('should merge pdfMargins properties', () => {
      const config = mergeConfig({
        pdfMargins: { top: '20px' },
      });
      expect(config.pdfMargins.top).toBe('20px');
      expect(config.pdfMargins.bottom).toBe(DEFAULT_CONFIG.pdfMargins.bottom);
    });

    it('should not modify the original DEFAULT_CONFIG', () => {
      const originalRootFolder = DEFAULT_CONFIG.rootFolder;
      mergeConfig({ rootFolder: 'Modified' });
      expect(DEFAULT_CONFIG.rootFolder).toBe(originalRootFolder);
    });
  });

  describe('validateConfig', () => {
    it('should return isValid true for valid config', () => {
      const result = validateConfig(DEFAULT_CONFIG);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors.length).toBe(0);
    });

    it('should return error for missing rootFolder', () => {
      const config = { ...DEFAULT_CONFIG, rootFolder: '' };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('rootFolder must be a non-empty string');
    });

    it('should return error for missing model', () => {
      const config = { ...DEFAULT_CONFIG, model: '' };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('model must be a non-empty string');
    });

    it('should return error for invalid temperature', () => {
      const config = { ...DEFAULT_CONFIG, temperature: 3 };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('temperature must be a number between 0 and 2');
    });

    it('should return error for negative temperature', () => {
      const config = { ...DEFAULT_CONFIG, temperature: -1 };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return error for invalid maxTokens', () => {
      const config = { ...DEFAULT_CONFIG, maxTokens: 0 };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('maxTokens must be a positive integer');
    });

    it('should return error for invalid branding color', () => {
      const config = {
        ...DEFAULT_CONFIG,
        branding: { ...DEFAULT_CONFIG.branding, primaryColor: 'invalid' },
      };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('branding.primaryColor must be a valid hex color');
    });

    it('should collect multiple errors', () => {
      const config = {
        ...DEFAULT_CONFIG,
        rootFolder: '',
        model: '',
        temperature: 5,
      };
      const result = validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('getEnvConfig', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      // Restore original environment
      process.env = { ...originalEnv };
    });

    it('should return an object', () => {
      const config = getEnvConfig();
      expect(config).toBeTypeOf('object');
    });

    it('should read OPENAI_API_KEY from environment', () => {
      process.env.OPENAI_API_KEY = 'test-api-key';
      const config = getEnvConfig();
      expect(config.openaiApiKey).toBe('test-api-key');
    });

    it('should read NEON_MODEL from environment', () => {
      process.env.NEON_MODEL = 'gpt-4-turbo';
      const config = getEnvConfig();
      expect(config.model).toBe('gpt-4-turbo');
    });

    it('should use default model when NEON_MODEL not set', () => {
      delete process.env.NEON_MODEL;
      const config = getEnvConfig();
      expect(config.model).toBe(DEFAULT_CONFIG.model);
    });

    it('should read NEON_VERBOSE from environment', () => {
      process.env.NEON_VERBOSE = 'true';
      const config = getEnvConfig();
      expect(config.verboseLogging).toBe(true);
    });

    it('should default verboseLogging to false', () => {
      delete process.env.NEON_VERBOSE;
      const config = getEnvConfig();
      expect(config.verboseLogging).toBe(false);
    });
  });
});