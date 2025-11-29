/**
 * Tests for progress utilities module
 * Using Vitest
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createProgressBar,
  createMultiBar,
  logger,
  formatBytes,
  formatDuration,
  createTimer,
  printTable,
} from '../../src/utils/progress.js';

describe('Progress Utilities', () => {
  describe('createProgressBar', () => {
    it('should return a progress bar object', () => {
      const bar = createProgressBar();
      expect(bar).toBeDefined();
      expect(bar).toHaveProperty('start');
      expect(bar).toHaveProperty('stop');
      expect(bar).toHaveProperty('increment');
    });

    it('should accept custom options', () => {
      const bar = createProgressBar({
        format: 'custom format',
        clearOnComplete: true,
      });
      expect(bar).toBeDefined();
    });
  });

  describe('createMultiBar', () => {
    it('should return a multi-bar object', () => {
      const multiBar = createMultiBar();
      expect(multiBar).toBeDefined();
      expect(multiBar).toHaveProperty('create');
      expect(multiBar).toHaveProperty('stop');
    });
  });

  describe('logger', () => {
    it('should have info method', () => {
      expect(logger).toHaveProperty('info');
      expect(typeof logger.info).toBe('function');
    });

    it('should have success method', () => {
      expect(logger).toHaveProperty('success');
      expect(typeof logger.success).toBe('function');
    });

    it('should have warn method', () => {
      expect(logger).toHaveProperty('warn');
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(logger).toHaveProperty('error');
      expect(typeof logger.error).toBe('function');
    });

    it('should have debug method', () => {
      expect(logger).toHaveProperty('debug');
      expect(typeof logger.debug).toBe('function');
    });

    it('should have section method', () => {
      expect(logger).toHaveProperty('section');
      expect(typeof logger.section).toBe('function');
    });

    it('should have step method', () => {
      expect(logger).toHaveProperty('step');
      expect(typeof logger.step).toBe('function');
    });

    it('should have blank method', () => {
      expect(logger).toHaveProperty('blank');
      expect(typeof logger.blank).toBe('function');
    });

    it('should call console.log for info', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.info('test message');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should call console.error for error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('test error');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should call console.warn for warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      logger.warn('test warning');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('formatBytes', () => {
    it('should return "0 Bytes" for 0', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
    });

    it('should handle large numbers', () => {
      const result = formatBytes(1024 * 1024 * 1024 * 1024);
      expect(result).toBe('1 TB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(65000)).toBe('1m 5s');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3665000)).toBe('1h 1m 5s');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0ms');
    });
  });

  describe('createTimer', () => {
    it('should return a timer object', () => {
      const timer = createTimer();
      expect(timer).toBeDefined();
      expect(timer).toHaveProperty('elapsed');
      expect(timer).toHaveProperty('format');
      expect(timer).toHaveProperty('stop');
    });

    it('should track elapsed time', async () => {
      const timer = createTimer();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const elapsed = timer.elapsed();
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it('should format elapsed time', async () => {
      const timer = createTimer();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const formatted = timer.format();
      expect(typeof formatted).toBe('string');
    });

    it('should stop and return duration info', async () => {
      const timer = createTimer();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const result = timer.stop();
      expect(result).toHaveProperty('ms');
      expect(result).toHaveProperty('formatted');
      expect(result.ms).toBeGreaterThanOrEqual(40);
    });
  });

  describe('printTable', () => {
    it('should print a table without errors', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const rows = [
        { name: 'Item 1', value: 100 },
        { name: 'Item 2', value: 200 },
      ];
      const columns = ['name', 'value'];

      expect(() => printTable(rows, columns)).not.toThrow();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should handle empty rows', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      expect(() => printTable([], ['col1', 'col2'])).not.toThrow();
      spy.mockRestore();
    });
  });
});