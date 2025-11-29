/**
 * ZIP packaging module using JSZip
 * Creates compressed archives for distribution
 */

import JSZip from 'jszip';
import fs from 'fs-extra';
import path from 'path';

/**
 * Default compression options
 */
const DEFAULT_COMPRESSION_OPTIONS = {
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: {
    level: 9,
  },
};

/**
 * Create a new ZIP archive
 * @returns {JSZip} New JSZip instance
 */
export const createZip = () => new JSZip();

/**
 * Add a file to a ZIP archive
 * @param {JSZip} zip - JSZip instance
 * @param {string} filename - Name of file in archive
 * @param {Buffer|string} content - File content
 * @param {Object} options - File options
 * @returns {JSZip} Updated JSZip instance
 */
export const addFileToZip = (zip, filename, content, options = {}) => {
  zip.file(filename, content, options);
  return zip;
};

/**
 * Add a directory of files to a ZIP archive
 * @param {JSZip} zip - JSZip instance
 * @param {string} dirPath - Directory path to add
 * @param {string} zipPath - Path prefix in ZIP archive
 * @param {Object} options - Options
 * @param {string[]} options.extensions - File extensions to include (e.g., ['.txt', '.pdf'])
 * @param {boolean} options.recursive - Include subdirectories
 * @returns {Promise<JSZip>} Updated JSZip instance
 */
export const addDirectoryToZip = async (zip, dirPath, zipPath = '', options = {}) => {
  const { extensions = null, recursive = true } = options;

  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory() && recursive) {
      await addDirectoryToZip(zip, filePath, path.join(zipPath, file), options);
    } else if (stat.isFile()) {
      // Check extension filter
      if (extensions && !extensions.includes(path.extname(file).toLowerCase())) {
        continue;
      }

      const content = await fs.readFile(filePath);
      const zipFilePath = zipPath ? path.join(zipPath, file) : file;
      zip.file(zipFilePath, content);
    }
  }

  return zip;
};

/**
 * Generate ZIP buffer from JSZip instance
 * @param {JSZip} zip - JSZip instance
 * @param {Object} options - Compression options
 * @returns {Promise<Buffer>} ZIP file buffer
 */
export const generateZipBuffer = async (zip, options = {}) => {
  const mergedOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  return zip.generateAsync(mergedOptions);
};

/**
 * Write ZIP archive to file
 * @param {JSZip} zip - JSZip instance
 * @param {string} outputPath - Output file path
 * @param {Object} options - Compression options
 * @returns {Promise<void>}
 */
export const writeZipToFile = async (zip, outputPath, options = {}) => {
  const buffer = await generateZipBuffer(zip, options);
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, buffer);
};

/**
 * Create a ZIP archive from a directory
 * @param {string} sourceDir - Source directory path
 * @param {string} outputPath - Output ZIP file path
 * @param {Object} options - Options
 * @param {string} options.rootFolder - Root folder name in ZIP
 * @param {string[]} options.extensions - File extensions to include
 * @param {boolean} options.recursive - Include subdirectories
 * @returns {Promise<string>} Output path
 */
export const zipDirectory = async (sourceDir, outputPath, options = {}) => {
  const { rootFolder = '', extensions = null, recursive = true } = options;

  const zip = createZip();

  if (rootFolder) {
    await addDirectoryToZip(zip, sourceDir, rootFolder, { extensions, recursive });
  } else {
    await addDirectoryToZip(zip, sourceDir, '', { extensions, recursive });
  }

  await writeZipToFile(zip, outputPath);
  return outputPath;
};

/**
 * Create a section ZIP archive
 * @param {Object} options - Options
 * @param {string} options.sectionId - Section ID
 * @param {string} options.sectionDir - Section directory path
 * @param {string} options.outputDir - Output directory for ZIP
 * @param {boolean} options.includeSourceFiles - Include .txt source files
 * @param {boolean} options.includePdfs - Include .pdf files
 * @returns {Promise<string>} ZIP file path
 */
export const createSectionZip = async (options) => {
  const {
    sectionId,
    sectionDir,
    outputDir,
    includeSourceFiles = true,
    includePdfs = true,
  } = options;

  const zip = createZip();
  const extensions = [];

  if (includeSourceFiles) {
    extensions.push('.txt');
  }
  if (includePdfs) {
    extensions.push('.pdf');
  }

  await addDirectoryToZip(zip, sectionDir, sectionId, {
    extensions: extensions.length > 0 ? extensions : null,
    recursive: false,
  });

  const outputPath = path.join(outputDir, `${sectionId}.zip`);
  await writeZipToFile(zip, outputPath);

  return outputPath;
};

/**
 * Create a master ZIP containing all section ZIPs
 * @param {string[]} sectionZipPaths - Array of section ZIP file paths
 * @param {string} outputPath - Output path for master ZIP
 * @param {Object} options - Additional options
 * @param {string} options.readmePath - Path to README file to include
 * @param {string} options.licensePath - Path to LICENSE file to include
 * @returns {Promise<string>} Master ZIP file path
 */
export const createMasterZip = async (sectionZipPaths, outputPath, options = {}) => {
  const { readmePath, licensePath } = options;

  const zip = createZip();

  // Add section ZIPs
  for (const zipPath of sectionZipPaths) {
    const filename = path.basename(zipPath);
    const content = await fs.readFile(zipPath);
    zip.file(filename, content);
  }

  // Add README if provided
  if (readmePath && (await fs.pathExists(readmePath))) {
    const readme = await fs.readFile(readmePath);
    zip.file('README.md', readme);
  }

  // Add LICENSE if provided
  if (licensePath && (await fs.pathExists(licensePath))) {
    const license = await fs.readFile(licensePath);
    zip.file('LICENSE.txt', license);
  }

  await writeZipToFile(zip, outputPath);
  return outputPath;
};

/**
 * Get ZIP file statistics
 * @param {string} zipPath - Path to ZIP file
 * @returns {Promise<Object>} ZIP statistics
 */
export const getZipStats = async (zipPath) => {
  const content = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(content);

  const files = [];
  let totalUncompressedSize = 0;

  zip.forEach((relativePath, file) => {
    if (!file.dir) {
      files.push({
        name: relativePath,
        compressedSize: file._data?.compressedSize || 0,
        uncompressedSize: file._data?.uncompressedSize || 0,
      });
      totalUncompressedSize += file._data?.uncompressedSize || 0;
    }
  });

  const stat = await fs.stat(zipPath);

  return {
    path: zipPath,
    compressedSize: stat.size,
    uncompressedSize: totalUncompressedSize,
    fileCount: files.length,
    files,
    compressionRatio:
      totalUncompressedSize > 0 ? ((1 - stat.size / totalUncompressedSize) * 100).toFixed(2) : 0,
  };
};

/**
 * Extract ZIP archive
 * @param {string} zipPath - Path to ZIP file
 * @param {string} outputDir - Output directory
 * @returns {Promise<string[]>} Array of extracted file paths
 */
export const extractZip = async (zipPath, outputDir) => {
  const content = await fs.readFile(zipPath);
  const zip = await JSZip.loadAsync(content);

  const extractedPaths = [];

  await fs.ensureDir(outputDir);

  for (const [relativePath, file] of Object.entries(zip.files)) {
    const outputPath = path.join(outputDir, relativePath);

    if (file.dir) {
      await fs.ensureDir(outputPath);
    } else {
      await fs.ensureDir(path.dirname(outputPath));
      const fileContent = await file.async('nodebuffer');
      await fs.writeFile(outputPath, fileContent);
      extractedPaths.push(outputPath);
    }
  }

  return extractedPaths;
};

export default {
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
};