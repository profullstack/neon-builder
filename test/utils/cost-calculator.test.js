/**
 * Tests for cost-calculator utility
 * Using Vitest as the testing framework
 */

import { describe, it, expect } from 'vitest';
import {
  MODEL_PRICING,
  getModelPricing,
  calculateCost,
  formatCost,
  createCostTracker,
} from '../../src/utils/cost-calculator.js';

describe('cost-calculator', () => {
  describe('MODEL_PRICING', () => {
    it('should contain pricing for GPT-4 models', () => {
      expect(MODEL_PRICING['gpt-4']).toBeDefined();
      expect(MODEL_PRICING['gpt-4'].input).toBeGreaterThan(0);
      expect(MODEL_PRICING['gpt-4'].output).toBeGreaterThan(0);
    });

    it('should contain pricing for GPT-4o models', () => {
      expect(MODEL_PRICING['gpt-4o']).toBeDefined();
      expect(MODEL_PRICING['gpt-4o-mini']).toBeDefined();
    });

    it('should contain pricing for GPT-3.5-turbo models', () => {
      expect(MODEL_PRICING['gpt-3.5-turbo']).toBeDefined();
    });

    it('should have output pricing higher than or equal to input pricing', () => {
      for (const [model, pricing] of Object.entries(MODEL_PRICING)) {
        expect(pricing.output).toBeGreaterThanOrEqual(pricing.input);
      }
    });
  });

  describe('getModelPricing', () => {
    it('should return exact pricing for known models', () => {
      const pricing = getModelPricing('gpt-4');
      expect(pricing).toEqual(MODEL_PRICING['gpt-4']);
    });

    it('should return pricing for GPT-4o', () => {
      const pricing = getModelPricing('gpt-4o');
      expect(pricing.input).toBe(0.005);
      expect(pricing.output).toBe(0.015);
    });

    it('should return pricing for GPT-4o-mini', () => {
      const pricing = getModelPricing('gpt-4o-mini');
      expect(pricing.input).toBe(0.00015);
      expect(pricing.output).toBe(0.0006);
    });

    it('should return default pricing for unknown models', () => {
      const pricing = getModelPricing('unknown-model-xyz');
      expect(pricing.input).toBe(0.03);
      expect(pricing.output).toBe(0.06);
    });

    it('should handle case-insensitive model names via prefix matching', () => {
      const pricing = getModelPricing('gpt-4-turbo-2024-01-01');
      expect(pricing).toBeDefined();
      expect(pricing.input).toBeGreaterThan(0);
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly for GPT-4', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
      };
      const cost = calculateCost(usage, 'gpt-4');
      // GPT-4: $0.03/1K input, $0.06/1K output
      // Expected: (1000/1000 * 0.03) + (500/1000 * 0.06) = 0.03 + 0.03 = 0.06
      expect(cost).toBe(0.06);
    });

    it('should calculate cost correctly for GPT-4o-mini', () => {
      const usage = {
        promptTokens: 10000,
        completionTokens: 5000,
      };
      const cost = calculateCost(usage, 'gpt-4o-mini');
      // GPT-4o-mini: $0.00015/1K input, $0.0006/1K output
      // Expected: (10000/1000 * 0.00015) + (5000/1000 * 0.0006) = 0.0015 + 0.003 = 0.0045
      expect(cost).toBeCloseTo(0.0045, 6);
    });

    it('should return 0 for zero tokens', () => {
      const usage = {
        promptTokens: 0,
        completionTokens: 0,
      };
      const cost = calculateCost(usage, 'gpt-4');
      expect(cost).toBe(0);
    });

    it('should handle large token counts', () => {
      const usage = {
        promptTokens: 100000,
        completionTokens: 50000,
      };
      const cost = calculateCost(usage, 'gpt-4');
      // Expected: (100000/1000 * 0.03) + (50000/1000 * 0.06) = 3 + 3 = 6
      expect(cost).toBe(6);
    });
  });

  describe('formatCost', () => {
    it('should format costs >= $0.01 with 2 decimal places', () => {
      expect(formatCost(1.5)).toBe('$1.50');
      expect(formatCost(0.05)).toBe('$0.05');
      expect(formatCost(10.99)).toBe('$10.99');
    });

    it('should format costs < $0.01 with 4 decimal places', () => {
      expect(formatCost(0.0045)).toBe('$0.0045');
      expect(formatCost(0.001)).toBe('$0.0010');
      expect(formatCost(0.0001)).toBe('$0.0001');
    });

    it('should format zero cost', () => {
      expect(formatCost(0)).toBe('$0.0000');
    });

    it('should handle very small costs', () => {
      expect(formatCost(0.00001)).toBe('$0.0000');
    });
  });

  describe('createCostTracker', () => {
    it('should create a cost tracker with initial zero values', () => {
      const tracker = createCostTracker('gpt-4');
      expect(tracker.getTotalCost()).toBe(0);
      expect(tracker.getFormattedCost()).toBe('$0.0000');
      expect(tracker.getTotalUsage()).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it('should accumulate usage correctly', () => {
      const tracker = createCostTracker('gpt-4');

      tracker.addUsage({
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });

      tracker.addUsage({
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
      });

      const usage = tracker.getTotalUsage();
      expect(usage.promptTokens).toBe(300);
      expect(usage.completionTokens).toBe(150);
      expect(usage.totalTokens).toBe(450);
    });

    it('should calculate running cost correctly', () => {
      const tracker = createCostTracker('gpt-4');

      tracker.addUsage({
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      // GPT-4: $0.03/1K input, $0.06/1K output
      // Expected: (1000/1000 * 0.03) + (500/1000 * 0.06) = 0.06
      expect(tracker.getTotalCost()).toBe(0.06);
    });

    it('should return formatted cost', () => {
      const tracker = createCostTracker('gpt-4');

      tracker.addUsage({
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      expect(tracker.getFormattedCost()).toBe('$0.06');
    });

    it('should return complete summary', () => {
      const tracker = createCostTracker('gpt-4');

      tracker.addUsage({
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      const summary = tracker.getSummary();

      expect(summary.model).toBe('gpt-4');
      expect(summary.pricing).toEqual(MODEL_PRICING['gpt-4']);
      expect(summary.usage.promptTokens).toBe(1000);
      expect(summary.usage.completionTokens).toBe(500);
      expect(summary.usage.totalTokens).toBe(1500);
      expect(summary.cost).toBe(0.06);
      expect(summary.formattedCost).toBe('$0.06');
      expect(summary.breakdown.inputCost).toBe(0.03);
      expect(summary.breakdown.outputCost).toBe(0.03);
    });

    it('should handle missing usage properties gracefully', () => {
      const tracker = createCostTracker('gpt-4');

      tracker.addUsage({});

      const usage = tracker.getTotalUsage();
      expect(usage.promptTokens).toBe(0);
      expect(usage.completionTokens).toBe(0);
      expect(usage.totalTokens).toBe(0);
    });

    it('should work with different models', () => {
      const tracker = createCostTracker('gpt-4o-mini');

      tracker.addUsage({
        promptTokens: 10000,
        completionTokens: 5000,
        totalTokens: 15000,
      });

      // GPT-4o-mini: $0.00015/1K input, $0.0006/1K output
      // Expected: (10000/1000 * 0.00015) + (5000/1000 * 0.0006) = 0.0015 + 0.003 = 0.0045
      expect(tracker.getTotalCost()).toBeCloseTo(0.0045, 6);
    });
  });
});