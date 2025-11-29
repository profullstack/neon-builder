/**
 * Tests for file-system utilities module
 * Using Vitest
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs-extra';
import {
  ensureDirectory,
  writeFile,
  readFile,
  exists,
  remove,
  copy,
  listFiles,
  getStats,
  getDirectorySize,
  cleanDirectory,
  createTempDir,
  safeFileName,
  getUniquePath,
  move,
  appendFile,
} from '../../src/utils/file-system.js';

const TEST_DIR = path.join(process.cwd(), '.test-temp');

describe('File System Utilities', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('ensureDirectory', () => {
    it('should create a directory if it does not exist', async () => {
      const dirPath = path.join(TEST_DIR, 'new-dir');
      await ensureDirectory(dirPath);
      const dirExists = await fs.pathExists(dirPath);
      expect(dirExists).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const dirPath = path.join(TEST_DIR, 'existing-dir');
      await fs.ensureDir(dirPath);
      await expect(ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const dirPath = path.join(TEST_DIR, 'a', 'b', 'c');
      await ensureDirectory(dirPath);
      const dirExists = await fs.pathExists(dirPath);
      expect(dirExists).toBe(true);
    });
  });

  describe('writeFile', () => {
    it('should write content to a file', async () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      await writeFile(filePath, 'Hello, World!');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Hello, World!');
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = path.join(TEST_DIR, 'nested', 'dir', 'test.txt');
      await writeFile(filePath, 'Nested content');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Nested content');
    });

    it('should overwrite existing file', async () => {
      const filePath = path.join(TEST_DIR, 'overwrite.txt');
      await writeFile(filePath, 'Original');
      await writeFile(filePath, 'Updated');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Updated');
    });
  });

  describe('readFile', () => {
    it('should read content from a file', async () => {
      const filePath = path.join(TEST_DIR, 'read-test.txt');
      await fs.writeFile(filePath, 'Test content');
      const content = await readFile(filePath);
      expect(content).toBe('Test content');
    });

    it('should throw error for non-existent file', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent.txt');
      await expect(readFile(filePath)).rejects.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(TEST_DIR, 'exists.txt');
      await fs.writeFile(filePath, 'content');
      const result = await exists(filePath);
      expect(result).toBe(true);
    });

    it('should return true for existing directory', async () => {
      const result = await exists(TEST_DIR);
      expect(result).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      const result = await exists(path.join(TEST_DIR, 'non-existent'));
      expect(result).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove a file', async () => {
      const filePath = path.join(TEST_DIR, 'to-remove.txt');
      await fs.writeFile(filePath, 'content');
      await remove(filePath);
      const fileExists = await fs.pathExists(filePath);
      expect(fileExists).toBe(false);
    });

    it('should remove a directory', async () => {
      const dirPath = path.join(TEST_DIR, 'to-remove-dir');
      await fs.ensureDir(dirPath);
      await remove(dirPath);
      const dirExists = await fs.pathExists(dirPath);
      expect(dirExists).toBe(false);
    });

    it('should not throw for non-existent path', async () => {
      const filePath = path.join(TEST_DIR, 'non-existent');
      await expect(remove(filePath)).resolves.not.toThrow();
    });
  });

  describe('copy', () => {
    it('should copy a file', async () => {
      const srcPath = path.join(TEST_DIR, 'src.txt');
      const destPath = path.join(TEST_DIR, 'dest.txt');
      await fs.writeFile(srcPath, 'copy content');
      await copy(srcPath, destPath);
      const content = await fs.readFile(destPath, 'utf-8');
      expect(content).toBe('copy content');
    });

    it('should copy a directory', async () => {
      const srcDir = path.join(TEST_DIR, 'src-dir');
      const destDir = path.join(TEST_DIR, 'dest-dir');
      await fs.ensureDir(srcDir);
      await fs.writeFile(path.join(srcDir, 'file.txt'), 'content');
      await copy(srcDir, destDir);
      const fileExists = await fs.pathExists(path.join(destDir, 'file.txt'));
      expect(fileExists).toBe(true);
    });
  });

  describe('listFiles', () => {
    beforeEach(async () => {
      await fs.writeFile(path.join(TEST_DIR, 'file1.txt'), 'content');
      await fs.writeFile(path.join(TEST_DIR, 'file2.js'), 'content');
      await fs.ensureDir(path.join(TEST_DIR, 'subdir'));
      await fs.writeFile(path.join(TEST_DIR, 'subdir', 'file3.txt'), 'content');
    });

    it('should list files in a directory', async () => {
      const files = await listFiles(TEST_DIR);
      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.js');
    });

    it('should list files recursively when option is set', async () => {
      const files = await listFiles(TEST_DIR, { recursive: true });
      expect(files).toContain('file1.txt');
      expect(files).toContain(path.join('subdir', 'file3.txt'));
    });

    it('should filter by extension', async () => {
      const files = await listFiles(TEST_DIR, { extensions: ['.txt'] });
      expect(files).toContain('file1.txt');
      expect(files).not.toContain('file2.js');
    });

    it('should filter by extension recursively', async () => {
      const files = await listFiles(TEST_DIR, { recursive: true, extensions: ['.txt'] });
      expect(files).toContain('file1.txt');
      expect(files).toContain(path.join('subdir', 'file3.txt'));
      expect(files).not.toContain('file2.js');
    });
  });

  describe('getStats', () => {
    it('should return file stats', async () => {
      const filePath = path.join(TEST_DIR, 'stats.txt');
      await fs.writeFile(filePath, 'content');
      const stats = await getStats(filePath);
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('created');
      expect(stats).toHaveProperty('modified');
      expect(stats).toHaveProperty('isFile');
      expect(stats).toHaveProperty('isDirectory');
      expect(stats.isFile).toBe(true);
      expect(stats.isDirectory).toBe(false);
    });

    it('should return directory stats', async () => {
      const stats = await getStats(TEST_DIR);
      expect(stats.isFile).toBe(false);
      expect(stats.isDirectory).toBe(true);
    });
  });

  describe('getDirectorySize', () => {
    it('should return total size of directory', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'size1.txt'), 'Hello');
      await fs.writeFile(path.join(TEST_DIR, 'size2.txt'), 'World');
      const size = await getDirectorySize(TEST_DIR);
      expect(size).toBeGreaterThan(0);
    });

    it('should include nested files', async () => {
      await fs.ensureDir(path.join(TEST_DIR, 'nested'));
      await fs.writeFile(path.join(TEST_DIR, 'nested', 'file.txt'), 'Nested content');
      const size = await getDirectorySize(TEST_DIR);
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('cleanDirectory', () => {
    it('should remove all contents but keep directory', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'clean1.txt'), 'content');
      await fs.writeFile(path.join(TEST_DIR, 'clean2.txt'), 'content');
      await cleanDirectory(TEST_DIR);
      const files = await fs.readdir(TEST_DIR);
      expect(files.length).toBe(0);
      const dirExists = await fs.pathExists(TEST_DIR);
      expect(dirExists).toBe(true);
    });
  });

  describe('createTempDir', () => {
    it('should create a temporary directory', async () => {
      const tempDir = await createTempDir('test-');
      const dirExists = await fs.pathExists(tempDir);
      expect(dirExists).toBe(true);
      expect(tempDir).toContain('test-');
      await fs.remove(tempDir);
    });

    it('should use default prefix', async () => {
      const tempDir = await createTempDir();
      const dirExists = await fs.pathExists(tempDir);
      expect(dirExists).toBe(true);
      expect(tempDir).toContain('neon-');
      await fs.remove(tempDir);
    });
  });

  describe('safeFileName', () => {
    it('should remove invalid characters', () => {
      expect(safeFileName('file<>:"/\\|?*.txt')).toBe('file_.txt');
    });

    it('should replace spaces with underscores', () => {
      expect(safeFileName('my file name.txt')).toBe('my_file_name.txt');
    });

    it('should collapse multiple underscores', () => {
      expect(safeFileName('file___name.txt')).toBe('file_name.txt');
    });

    it('should handle normal filenames', () => {
      expect(safeFileName('normal-file.txt')).toBe('normal-file.txt');
    });
  });

  describe('getUniquePath', () => {
    it('should return original path if it does not exist', async () => {
      const filePath = path.join(TEST_DIR, 'unique.txt');
      const result = await getUniquePath(filePath);
      expect(result).toBe(filePath);
    });

    it('should return path with suffix if original exists', async () => {
      const filePath = path.join(TEST_DIR, 'exists.txt');
      await fs.writeFile(filePath, 'content');
      const result = await getUniquePath(filePath);
      expect(result).toBe(path.join(TEST_DIR, 'exists_1.txt'));
    });

    it('should increment suffix until unique', async () => {
      const filePath = path.join(TEST_DIR, 'multi.txt');
      await fs.writeFile(filePath, 'content');
      await fs.writeFile(path.join(TEST_DIR, 'multi_1.txt'), 'content');
      const result = await getUniquePath(filePath);
      expect(result).toBe(path.join(TEST_DIR, 'multi_2.txt'));
    });
  });

  describe('move', () => {
    it('should move a file', async () => {
      const srcPath = path.join(TEST_DIR, 'move-src.txt');
      const destPath = path.join(TEST_DIR, 'move-dest.txt');
      await fs.writeFile(srcPath, 'move content');
      await move(srcPath, destPath);
      const srcExists = await fs.pathExists(srcPath);
      const destExists = await fs.pathExists(destPath);
      expect(srcExists).toBe(false);
      expect(destExists).toBe(true);
    });
  });

  describe('appendFile', () => {
    it('should append content to a file', async () => {
      const filePath = path.join(TEST_DIR, 'append.txt');
      await fs.writeFile(filePath, 'Hello');
      await appendFile(filePath, ' World');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Hello World');
    });

    it('should create file if it does not exist', async () => {
      const filePath = path.join(TEST_DIR, 'new-append.txt');
      await appendFile(filePath, 'New content');
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('New content');
    });
  });
});