/**
 * Default configuration values for the Neon Prompt Engine Builder
 */

export const DEFAULT_CONFIG = {
  // Project settings
  rootFolder: 'NeonPromptEngine',
  outputDir: './dist',

  // OpenAI settings
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 4000,
  maxRetries: 3,
  retryDelay: 1000,

  // PDF settings
  generatePDFs: true,
  pdfFormat: 'A4',
  pdfMargins: {
    top: '40px',
    right: '40px',
    bottom: '40px',
    left: '40px',
  },

  // Branding settings
  branding: {
    primaryColor: '#00FFC8',
    secondaryColor: '#1a1a2e',
    accentColor: '#16213e',
    textColor: '#ffffff',
    logoUrl: 'https://your-domain.com/logo.png',
    footerText: '© Neon Prompt Engine',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },

  // ZIP settings
  compressionLevel: 9,
  includeSourceFiles: true,

  // Progress settings
  showProgress: true,
  verboseLogging: false,
};

/**
 * Merge user configuration with defaults
 * @param {Object} userConfig - User-provided configuration
 * @returns {Object} Merged configuration
 */
export const mergeConfig = (userConfig = {}) => {
  const merged = { ...DEFAULT_CONFIG };

  // Merge top-level properties
  for (const key of Object.keys(userConfig)) {
    if (key === 'branding' && typeof userConfig.branding === 'object') {
      merged.branding = { ...DEFAULT_CONFIG.branding, ...userConfig.branding };
    } else if (key === 'pdfMargins' && typeof userConfig.pdfMargins === 'object') {
      merged.pdfMargins = { ...DEFAULT_CONFIG.pdfMargins, ...userConfig.pdfMargins };
    } else if (userConfig[key] !== undefined) {
      merged[key] = userConfig[key];
    }
  }

  return merged;
};

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateConfig = (config) => {
  const errors = [];

  // Validate required string fields
  const requiredStrings = ['rootFolder', 'model'];
  for (const field of requiredStrings) {
    if (!config[field] || typeof config[field] !== 'string') {
      errors.push(`${field} must be a non-empty string`);
    }
  }

  // Validate temperature
  if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
    errors.push('temperature must be a number between 0 and 2');
  }

  // Validate maxTokens
  if (!Number.isInteger(config.maxTokens) || config.maxTokens < 1) {
    errors.push('maxTokens must be a positive integer');
  }

  // Validate branding
  if (config.branding) {
    if (!config.branding.primaryColor?.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push('branding.primaryColor must be a valid hex color');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get environment-based configuration overrides
 * @returns {Object} Environment configuration
 */
export const getEnvConfig = () => ({
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: process.env.NEON_MODEL || DEFAULT_CONFIG.model,
  outputDir: process.env.NEON_OUTPUT_DIR || DEFAULT_CONFIG.outputDir,
  verboseLogging: process.env.NEON_VERBOSE === 'true',
});

export default DEFAULT_CONFIG;