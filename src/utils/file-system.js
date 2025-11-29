/**
 * File system utilities
 */

import fs from 'fs-extra';
import path from 'path';

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
export const ensureDirectory = async (dirPath) => {
  await fs.ensureDir(dirPath);
};

/**
 * Write content to a file, creating directories as needed
 * @param {string} filePath - File path
 * @param {string|Buffer} content - File content
 * @returns {Promise<void>}
 */
export const writeFile = async (filePath, content) => {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
};

/**
 * Read file content
 * @param {string} filePath - File path
 * @returns {Promise<string>} File content
 */
export const readFile = async (filePath) => fs.readFile(filePath, 'utf-8');

/**
 * Check if a file or directory exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if exists
 */
export const exists = async (filePath) => fs.pathExists(filePath);

/**
 * Remove a file or directory
 * @param {string} filePath - Path to remove
 * @returns {Promise<void>}
 */
export const remove = async (filePath) => {
  await fs.remove(filePath);
};

/**
 * Copy a file or directory
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 * @returns {Promise<void>}
 */
export const copy = async (src, dest) => {
  await fs.copy(src, dest);
};

/**
 * List files in a directory
 * @param {string} dirPath - Directory path
 * @param {Object} options - Options
 * @param {boolean} options.recursive - List recursively
 * @param {string[]} options.extensions - Filter by extensions
 * @returns {Promise<string[]>} Array of file paths
 */
export const listFiles = async (dirPath, options = {}) => {
  const { recursive = false, extensions = null } = options;

  const files = [];

  const processDir = async (currentPath, relativePath = '') => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory() && recursive) {
        await processDir(fullPath, relPath);
      } else if (entry.isFile()) {
        if (!extensions || extensions.includes(path.extname(entry.name).toLowerCase())) {
          files.push(relPath);
        }
      }
    }
  };

  await processDir(dirPath);
  return files;
};

/**
 * Get file statistics
 * @param {string} filePath - File path
 * @returns {Promise<Object>} File stats
 */
export const getStats = async (filePath) => {
  const stats = await fs.stat(filePath);
  return {
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
  };
};

/**
 * Get directory size recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Total size in bytes
 */
export const getDirectorySize = async (dirPath) => {
  let totalSize = 0;

  const processDir = async (currentPath) => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await processDir(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  };

  await processDir(dirPath);
  return totalSize;
};

/**
 * Clean a directory (remove all contents but keep the directory)
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
export const cleanDirectory = async (dirPath) => {
  await fs.emptyDir(dirPath);
};

/**
 * Create a temporary directory
 * @param {string} prefix - Directory name prefix
 * @returns {Promise<string>} Temporary directory path
 */
export const createTempDir = async (prefix = 'neon-') => {
  const tempBase = path.join(process.cwd(), '.temp');
  await fs.ensureDir(tempBase);
  const tempDir = path.join(tempBase, `${prefix}${Date.now()}`);
  await fs.ensureDir(tempDir);
  return tempDir;
};

/**
 * Safe file name (remove invalid characters)
 * @param {string} name - Original name
 * @returns {string} Safe name
 */
export const safeFileName = (name) =>
  name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();

/**
 * Get unique file path (add number suffix if exists)
 * @param {string} filePath - Desired file path
 * @returns {Promise<string>} Unique file path
 */
export const getUniquePath = async (filePath) => {
  if (!(await exists(filePath))) {
    return filePath;
  }

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);

  let counter = 1;
  let newPath;

  do {
    newPath = path.join(dir, `${base}_${counter}${ext}`);
    counter++;
  } while (await exists(newPath));

  return newPath;
};

/**
 * Move a file or directory
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 * @returns {Promise<void>}
 */
export const move = async (src, dest) => {
  await fs.move(src, dest, { overwrite: true });
};

/**
 * Append content to a file
 * @param {string} filePath - File path
 * @param {string} content - Content to append
 * @returns {Promise<void>}
 */
export const appendFile = async (filePath, content) => {
  await fs.appendFile(filePath, content, 'utf-8');
};

export default {
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
};