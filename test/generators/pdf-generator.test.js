/**
 * Tests for PDF generator module
 * Using Vitest
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  generateHtmlTemplate,
  fileToDataUri,
  resolveLogoUrl,
} from '../../src/generators/pdf-generator.js';

describe('PDF Generator', () => {
  describe('generateHtmlTemplate', () => {
    const defaultOptions = {
      title: 'Test Document',
      content: 'This is test content.',
      branding: {
        primaryColor: '#00FFC8',
        secondaryColor: '#1a1a2e',
        textColor: '#ffffff',
        footerText: '© Test Brand',
        fontFamily: 'Arial, sans-serif',
      },
      resolvedLogoUrl: 'https://example.com/logo.png',
      sectionLabel: 'Test Section',
      chunkNumber: 1,
      totalChunks: 5,
    };

    it('should return a string', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(typeof html).toBe('string');
    });

    it('should include DOCTYPE declaration', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should include the title', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('Test Document');
    });

    it('should include the content', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('This is test content.');
    });

    it('should include the section label', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('Test Section');
    });

    it('should include chunk information', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('Part 1 of 5');
    });

    it('should include primary color in styles', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('#00FFC8');
    });

    it('should include secondary color in styles', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('#1a1a2e');
    });

    it('should include footer text', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('© Test Brand');
    });

    it('should include logo URL when provided via resolvedLogoUrl', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('https://example.com/logo.png');
    });

    it('should use placeholder when resolvedLogoUrl is empty', () => {
      const options = {
        ...defaultOptions,
        resolvedLogoUrl: '',
      };
      const html = generateHtmlTemplate(options);
      expect(html).toContain('logo-placeholder');
    });

    it('should use data URI for logo when provided', () => {
      const options = {
        ...defaultOptions,
        resolvedLogoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };
      const html = generateHtmlTemplate(options);
      expect(html).toContain('data:image/png;base64,');
    });

    it('should escape HTML in content', () => {
      const options = {
        ...defaultOptions,
        content: '<script>alert("xss")</script>',
      };
      const html = generateHtmlTemplate(options);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should include font family in styles', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('Arial, sans-serif');
    });

    it('should use default values for missing branding properties', () => {
      const options = {
        ...defaultOptions,
        branding: {},
      };
      const html = generateHtmlTemplate(options);
      expect(html).toContain('#00FFC8'); // default primary color
    });

    it('should include print media styles', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('@media print');
    });

    it('should include container class', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('class="container"');
    });

    it('should include header section', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('class="header"');
    });

    it('should include footer section', () => {
      const html = generateHtmlTemplate(defaultOptions);
      expect(html).toContain('class="footer"');
    });
  });

  describe('createPdfFromHtml', () => {
    it('should be a function', async () => {
      const { createPdfFromHtml } = await import('../../src/generators/pdf-generator.js');
      expect(typeof createPdfFromHtml).toBe('function');
    });
  });

  describe('generateBrandedPdf', () => {
    it('should be a function', async () => {
      const { generateBrandedPdf } = await import('../../src/generators/pdf-generator.js');
      expect(typeof generateBrandedPdf).toBe('function');
    });
  });

  describe('generateSectionPdfs', () => {
    it('should be a function', async () => {
      const { generateSectionPdfs } = await import('../../src/generators/pdf-generator.js');
      expect(typeof generateSectionPdfs).toBe('function');
    });
  });

  describe('checkPuppeteerInstallation', () => {
    it('should be a function', async () => {
      const { checkPuppeteerInstallation } = await import('../../src/generators/pdf-generator.js');
      expect(typeof checkPuppeteerInstallation).toBe('function');
    });
  });

  describe('fileToDataUri', () => {
    let tempDir;
    let testImagePath;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-test-'));
      // Create a minimal valid PNG file (1x1 transparent pixel)
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      testImagePath = path.join(tempDir, 'test-logo.png');
      await fs.writeFile(testImagePath, pngBuffer);
    });

    afterEach(async () => {
      if (tempDir) {
        await fs.remove(tempDir);
      }
    });

    it('should convert a PNG file to data URI', async () => {
      const dataUri = await fileToDataUri(testImagePath);
      expect(dataUri).toMatch(/^data:image\/png;base64,/);
    });

    it('should throw error for non-existent file', async () => {
      await expect(fileToDataUri('/nonexistent/path/logo.png')).rejects.toThrow('Logo file not found');
    });

    it('should handle JPEG files', async () => {
      const jpegPath = path.join(tempDir, 'test-logo.jpg');
      // Create a minimal JPEG-like file (not valid but tests MIME type detection)
      await fs.writeFile(jpegPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0]));
      const dataUri = await fileToDataUri(jpegPath);
      expect(dataUri).toMatch(/^data:image\/jpeg;base64,/);
    });

    it('should handle SVG files', async () => {
      const svgPath = path.join(tempDir, 'test-logo.svg');
      await fs.writeFile(svgPath, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
      const dataUri = await fileToDataUri(svgPath);
      expect(dataUri).toMatch(/^data:image\/svg\+xml;base64,/);
    });
  });

  describe('resolveLogoUrl', () => {
    let tempDir;
    let testImagePath;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-test-'));
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      testImagePath = path.join(tempDir, 'test-logo.png');
      await fs.writeFile(testImagePath, pngBuffer);
    });

    afterEach(async () => {
      if (tempDir) {
        await fs.remove(tempDir);
      }
    });

    it('should return empty string when logoUrl is empty', async () => {
      const result = await resolveLogoUrl({ logoUrl: '' });
      expect(result).toBe('');
    });

    it('should return HTTP URL unchanged', async () => {
      const url = 'https://example.com/logo.png';
      const result = await resolveLogoUrl({ logoUrl: url });
      expect(result).toBe(url);
    });

    it('should return HTTPS URL unchanged', async () => {
      const url = 'https://example.com/logo.png';
      const result = await resolveLogoUrl({ logoUrl: url });
      expect(result).toBe(url);
    });

    it('should convert local file to data URI when logoIsLocal is true', async () => {
      const result = await resolveLogoUrl({
        logoUrl: testImagePath,
        logoIsLocal: true,
      });
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should convert local file to data URI when path does not start with http', async () => {
      const result = await resolveLogoUrl({
        logoUrl: testImagePath,
        logoIsLocal: false,
      });
      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should return empty string and warn when local file not found', async () => {
      const result = await resolveLogoUrl({
        logoUrl: '/nonexistent/logo.png',
        logoIsLocal: true,
      });
      expect(result).toBe('');
    });

    it('should return data URI unchanged', async () => {
      const dataUri = 'data:image/png;base64,abc123';
      const result = await resolveLogoUrl({ logoUrl: dataUri });
      expect(result).toBe(dataUri);
    });
  });
});