/**
 * Configuration module exports
 */

export {
  SECTIONS,
  getSectionById,
  getSectionIds,
  getTotalChunks,
  validateSection,
} from './sections.js';

export {
  DEFAULT_CONFIG,
  mergeConfig,
  validateConfig,
  getEnvConfig,
} from './defaults.js';