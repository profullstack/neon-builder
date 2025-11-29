/**
 * Generators module exports
 */

export {
  createOpenAIClient,
  buildPrompt,
  generateChunk,
  generateSection,
  validateApiKey,
  getAvailableModels,
} from './content-generator.js';

export {
  generateHtmlTemplate,
  createPdfFromHtml,
  generateBrandedPdf,
  generateSectionPdfs,
  checkPuppeteerInstallation,
} from './pdf-generator.js';

export {
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
} from './zip-packager.js';