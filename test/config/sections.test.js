/**
 * Tests for sections configuration module
 * Using Vitest
 */

import { describe, it, expect } from 'vitest';
import {
  SECTIONS,
  getSectionById,
  getSectionIds,
  getTotalChunks,
  validateSection,
} from '../../src/config/sections.js';

describe('Sections Configuration', () => {
  describe('SECTIONS constant', () => {
    it('should be an array', () => {
      expect(SECTIONS).toBeInstanceOf(Array);
    });

    it('should have at least one section', () => {
      expect(SECTIONS.length).toBeGreaterThan(0);
    });

    it('should have sections with required properties', () => {
      for (const section of SECTIONS) {
        expect(section).toHaveProperty('id');
        expect(typeof section.id).toBe('string');
        expect(section).toHaveProperty('label');
        expect(typeof section.label).toBe('string');
        expect(section).toHaveProperty('defaultChunks');
        expect(typeof section.defaultChunks).toBe('number');
        expect(section).toHaveProperty('description');
        expect(typeof section.description).toBe('string');
      }
    });

    it('should have unique section IDs', () => {
      const ids = SECTIONS.map((s) => s.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should have positive defaultChunks values', () => {
      for (const section of SECTIONS) {
        expect(section.defaultChunks).toBeGreaterThan(0);
      }
    });
  });

  describe('getSectionById', () => {
    it('should return a section when given a valid ID', () => {
      const section = getSectionById('core_prompts');
      expect(section).toBeDefined();
      expect(section).toBeTypeOf('object');
      expect(section.id).toBe('core_prompts');
    });

    it('should return undefined for invalid ID', () => {
      const section = getSectionById('nonexistent_section');
      expect(section).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const section = getSectionById('');
      expect(section).toBeUndefined();
    });

    it('should return undefined for null', () => {
      const section = getSectionById(null);
      expect(section).toBeUndefined();
    });
  });

  describe('getSectionIds', () => {
    it('should return an array of strings', () => {
      const ids = getSectionIds();
      expect(ids).toBeInstanceOf(Array);
      ids.forEach((id) => {
        expect(typeof id).toBe('string');
      });
    });

    it('should return the same number of IDs as sections', () => {
      const ids = getSectionIds();
      expect(ids.length).toBe(SECTIONS.length);
    });

    it('should include known section IDs', () => {
      const ids = getSectionIds();
      expect(ids).toContain('core_prompts');
      expect(ids).toContain('premium_prompts');
    });
  });

  describe('getTotalChunks', () => {
    it('should return a positive number', () => {
      const total = getTotalChunks();
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThan(0);
    });

    it('should equal the sum of all defaultChunks', () => {
      const expected = SECTIONS.reduce((sum, s) => sum + s.defaultChunks, 0);
      const total = getTotalChunks();
      expect(total).toBe(expected);
    });
  });

  describe('validateSection', () => {
    it('should return true for valid section', () => {
      const validSection = {
        id: 'test_section',
        label: 'Test Section',
        defaultChunks: 5,
        description: 'A test section',
      };
      expect(validateSection(validSection)).toBe(true);
    });

    it('should throw error for missing id', () => {
      const invalidSection = {
        label: 'Test',
        defaultChunks: 5,
        description: 'Test',
      };
      expect(() => validateSection(invalidSection)).toThrow('valid string id');
    });

    it('should throw error for non-string id', () => {
      const invalidSection = {
        id: 123,
        label: 'Test',
        defaultChunks: 5,
        description: 'Test',
      };
      expect(() => validateSection(invalidSection)).toThrow('valid string id');
    });

    it('should throw error for missing label', () => {
      const invalidSection = {
        id: 'test',
        defaultChunks: 5,
        description: 'Test',
      };
      expect(() => validateSection(invalidSection)).toThrow('valid string label');
    });

    it('should throw error for invalid defaultChunks', () => {
      const invalidSection = {
        id: 'test',
        label: 'Test',
        defaultChunks: 0,
        description: 'Test',
      };
      expect(() => validateSection(invalidSection)).toThrow('positive integer defaultChunks');
    });

    it('should throw error for non-integer defaultChunks', () => {
      const invalidSection = {
        id: 'test',
        label: 'Test',
        defaultChunks: 5.5,
        description: 'Test',
      };
      expect(() => validateSection(invalidSection)).toThrow('positive integer defaultChunks');
    });

    it('should throw error for missing description', () => {
      const invalidSection = {
        id: 'test',
        label: 'Test',
        defaultChunks: 5,
      };
      expect(() => validateSection(invalidSection)).toThrow('valid string description');
    });
  });
});