/**
 * Tests for ZIP packager module
 * Using Vitest
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import {
  createZip,
  addFileToZip,
  addDirectoryToZip,
  generateZipBuffer,
  writeZipToFile,
  zipDirectory,
  createSectionZip,
  createMasterZip,
  getZipStats,
  extractZip,
} from '../../src/generators/zip-packager.js';

const TEST_DIR = path.join(process.cwd(), '.test-zip-temp');

describe('ZIP Packager', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('createZip', () => {
    it('should return a JSZip instance', () => {
      const zip = createZip();
      expect(zip).toBeDefined();
      expect(zip).toHaveProperty('file');
      expect(zip).toHaveProperty('folder');
      expect(zip).toHaveProperty('generateAsync');
    });
  });

  describe('addFileToZip', () => {
    it('should add a file to the zip', () => {
      const zip = createZip();
      const result = addFileToZip(zip, 'test.txt', 'Hello, World!');
      expect(result).toBe(zip);
    });

    it('should add buffer content', () => {
      const zip = createZip();
      const buffer = Buffer.from('Binary content');
      const result = addFileToZip(zip, 'binary.bin', buffer);
      expect(result).toBe(zip);
    });

    it('should add file with path', () => {
      const zip = createZip();
      addFileToZip(zip, 'folder/nested/file.txt', 'Nested content');
      expect(zip.files['folder/nested/file.txt']).toBeDefined();
    });
  });

  describe('addDirectoryToZip', () => {
    beforeEach(async () => {
      await fs.writeFile(path.join(TEST_DIR, 'file1.txt'), 'Content 1');
      await fs.writeFile(path.join(TEST_DIR, 'file2.txt'), 'Content 2');
      await fs.ensureDir(path.join(TEST_DIR, 'subdir'));
      await fs.writeFile(path.join(TEST_DIR, 'subdir', 'file3.txt'), 'Content 3');
    });

    it('should add directory contents to zip', async () => {
      const zip = createZip();
      await addDirectoryToZip(zip, TEST_DIR);
      expect(zip.files['file1.txt']).toBeDefined();
      expect(zip.files['file2.txt']).toBeDefined();
    });

    it('should add nested directories when recursive', async () => {
      const zip = createZip();
      await addDirectoryToZip(zip, TEST_DIR, '', { recursive: true });
      expect(zip.files['subdir/file3.txt']).toBeDefined();
    });

    it('should filter by extension', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'file.js'), 'JS content');
      const zip = createZip();
      await addDirectoryToZip(zip, TEST_DIR, '', { extensions: ['.txt'] });
      expect(zip.files['file1.txt']).toBeDefined();
      expect(zip.files['file.js']).toBeUndefined();
    });

    it('should use zip path prefix', async () => {
      const zip = createZip();
      await addDirectoryToZip(zip, TEST_DIR, 'prefix');
      expect(zip.files['prefix/file1.txt']).toBeDefined();
    });
  });

  describe('generateZipBuffer', () => {
    it('should generate a buffer', async () => {
      const zip = createZip();
      addFileToZip(zip, 'test.txt', 'content');
      const buffer = await generateZipBuffer(zip);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('writeZipToFile', () => {
    it('should write zip to file', async () => {
      const zip = createZip();
      addFileToZip(zip, 'test.txt', 'content');
      const outputPath = path.join(TEST_DIR, 'output.zip');
      await writeZipToFile(zip, outputPath);
      const exists = await fs.pathExists(outputPath);
      expect(exists).toBe(true);
    });

    it('should create parent directories', async () => {
      const zip = createZip();
      addFileToZip(zip, 'test.txt', 'content');
      const outputPath = path.join(TEST_DIR, 'nested', 'dir', 'output.zip');
      await writeZipToFile(zip, outputPath);
      const exists = await fs.pathExists(outputPath);
      expect(exists).toBe(true);
    });
  });

  describe('zipDirectory', () => {
    beforeEach(async () => {
      await fs.writeFile(path.join(TEST_DIR, 'file1.txt'), 'Content 1');
      await fs.writeFile(path.join(TEST_DIR, 'file2.txt'), 'Content 2');
    });

    it('should create a zip from directory', async () => {
      const outputPath = path.join(TEST_DIR, 'dir.zip');
      const result = await zipDirectory(TEST_DIR, outputPath);
      expect(result).toBe(outputPath);
      const exists = await fs.pathExists(outputPath);
      expect(exists).toBe(true);
    });

    it('should use root folder option', async () => {
      const outputPath = path.join(TEST_DIR, 'root.zip');
      await zipDirectory(TEST_DIR, outputPath, { rootFolder: 'myroot' });
      const exists = await fs.pathExists(outputPath);
      expect(exists).toBe(true);
    });
  });

  describe('createSectionZip', () => {
    beforeEach(async () => {
      const sectionDir = path.join(TEST_DIR, 'section');
      await fs.ensureDir(sectionDir);
      await fs.writeFile(path.join(sectionDir, 'chunk_01.txt'), 'Chunk 1');
      await fs.writeFile(path.join(sectionDir, 'chunk_01.pdf'), 'PDF 1');
    });

    it('should create section zip', async () => {
      const sectionDir = path.join(TEST_DIR, 'section');
      const result = await createSectionZip({
        sectionId: 'test_section',
        sectionDir,
        outputDir: TEST_DIR,
      });
      expect(result).toContain('test_section.zip');
      const exists = await fs.pathExists(result);
      expect(exists).toBe(true);
    });

    it('should include only txt files when pdfs disabled', async () => {
      const sectionDir = path.join(TEST_DIR, 'section');
      const result = await createSectionZip({
        sectionId: 'test_section',
        sectionDir,
        outputDir: TEST_DIR,
        includePdfs: false,
      });
      const exists = await fs.pathExists(result);
      expect(exists).toBe(true);
    });
  });

  describe('createMasterZip', () => {
    beforeEach(async () => {
      // Create some section zips
      const zip1 = createZip();
      addFileToZip(zip1, 'file1.txt', 'content1');
      await writeZipToFile(zip1, path.join(TEST_DIR, 'section1.zip'));

      const zip2 = createZip();
      addFileToZip(zip2, 'file2.txt', 'content2');
      await writeZipToFile(zip2, path.join(TEST_DIR, 'section2.zip'));
    });

    it('should create master zip from section zips', async () => {
      const sectionZips = [
        path.join(TEST_DIR, 'section1.zip'),
        path.join(TEST_DIR, 'section2.zip'),
      ];
      const outputPath = path.join(TEST_DIR, 'master.zip');
      const result = await createMasterZip(sectionZips, outputPath);
      expect(result).toBe(outputPath);
      const exists = await fs.pathExists(outputPath);
      expect(exists).toBe(true);
    });

    it('should include README if provided', async () => {
      const readmePath = path.join(TEST_DIR, 'README.md');
      await fs.writeFile(readmePath, '# Test README');

      const sectionZips = [path.join(TEST_DIR, 'section1.zip')];
      const outputPath = path.join(TEST_DIR, 'master-readme.zip');
      await createMasterZip(sectionZips, outputPath, { readmePath });
      const exists = await fs.pathExists(outputPath);
      expect(exists).toBe(true);
    });
  });

  describe('getZipStats', () => {
    it('should return zip statistics', async () => {
      const zip = createZip();
      addFileToZip(zip, 'file1.txt', 'Content 1');
      addFileToZip(zip, 'file2.txt', 'Content 2');
      const zipPath = path.join(TEST_DIR, 'stats.zip');
      await writeZipToFile(zip, zipPath);

      const stats = await getZipStats(zipPath);
      expect(stats).toHaveProperty('path');
      expect(stats).toHaveProperty('compressedSize');
      expect(stats).toHaveProperty('fileCount');
      expect(stats).toHaveProperty('files');
      expect(stats.fileCount).toBe(2);
    });
  });

  describe('extractZip', () => {
    it('should extract zip contents', async () => {
      const zip = createZip();
      addFileToZip(zip, 'extracted.txt', 'Extracted content');
      const zipPath = path.join(TEST_DIR, 'extract.zip');
      await writeZipToFile(zip, zipPath);

      const extractDir = path.join(TEST_DIR, 'extracted');
      const files = await extractZip(zipPath, extractDir);
      expect(files).toContain(path.join(extractDir, 'extracted.txt'));
      const content = await fs.readFile(path.join(extractDir, 'extracted.txt'), 'utf-8');
      expect(content).toBe('Extracted content');
    });

    it('should handle nested directories', async () => {
      const zip = createZip();
      addFileToZip(zip, 'nested/dir/file.txt', 'Nested content');
      const zipPath = path.join(TEST_DIR, 'nested.zip');
      await writeZipToFile(zip, zipPath);

      const extractDir = path.join(TEST_DIR, 'extracted-nested');
      await extractZip(zipPath, extractDir);
      const exists = await fs.pathExists(path.join(extractDir, 'nested', 'dir', 'file.txt'));
      expect(exists).toBe(true);
    });
  });
});
