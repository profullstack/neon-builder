/**
 * Progress tracking and logging utilities
 */

import cliProgress from 'cli-progress';

/**
 * Create a single progress bar
 * @param {Object} options - Progress bar options
 * @param {string} options.format - Bar format string
 * @param {boolean} options.clearOnComplete - Clear bar on completion
 * @returns {cliProgress.SingleBar} Progress bar instance
 */
export const createProgressBar = (options = {}) => {
  const {
    format = '{bar} {percentage}% | {value}/{total} | {task}',
    clearOnComplete = false,
    hideCursor = true,
  } = options;

  return new cliProgress.SingleBar(
    {
      format,
      clearOnComplete,
      hideCursor,
      barCompleteChar: '█',
      barIncompleteChar: '░',
    },
    cliProgress.Presets.shades_classic
  );
};

/**
 * Create a multi-bar progress tracker
 * @param {Object} options - Multi-bar options
 * @returns {cliProgress.MultiBar} Multi-bar instance
 */
export const createMultiBar = (options = {}) => {
  const { format = '{bar} {percentage}% | {value}/{total} | {section}', hideCursor = true } =
    options;

  return new cliProgress.MultiBar(
    {
      format,
      hideCursor,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      clearOnComplete: false,
      stopOnComplete: true,
    },
    cliProgress.Presets.shades_classic
  );
};

/**
 * Logger with different log levels and formatting
 */
export const logger = {
  /**
   * Log info message
   * @param {string} message - Message to log
   */
  info: (message) => {
    console.log(`ℹ️  ${message}`);
  },

  /**
   * Log success message
   * @param {string} message - Message to log
   */
  success: (message) => {
    console.log(`✅ ${message}`);
  },

  /**
   * Log warning message
   * @param {string} message - Message to log
   */
  warn: (message) => {
    console.warn(`⚠️  ${message}`);
  },

  /**
   * Log error message
   * @param {string} message - Message to log
   */
  error: (message) => {
    console.error(`❌ ${message}`);
  },

  /**
   * Log debug message (only in verbose mode)
   * @param {string} message - Message to log
   * @param {boolean} verbose - Whether verbose mode is enabled
   */
  debug: (message, verbose = false) => {
    if (verbose) {
      console.log(`🔍 ${message}`);
    }
  },

  /**
   * Log a section header
   * @param {string} title - Section title
   */
  section: (title) => {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  ${title}`);
    console.log(`${'═'.repeat(50)}\n`);
  },

  /**
   * Log a step in a process
   * @param {number} step - Step number
   * @param {number} total - Total steps
   * @param {string} message - Step message
   */
  step: (step, total, message) => {
    console.log(`[${step}/${total}] ${message}`);
  },

  /**
   * Log a blank line
   */
  blank: () => {
    console.log('');
  },
};

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted string
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted string
 */
export const formatDuration = (ms) => {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Create a timer for tracking operation duration
 * @returns {Object} Timer object with stop method
 */
export const createTimer = () => {
  const start = Date.now();

  return {
    /**
     * Get elapsed time
     * @returns {number} Elapsed milliseconds
     */
    elapsed: () => Date.now() - start,

    /**
     * Get formatted elapsed time
     * @returns {string} Formatted duration
     */
    format: () => formatDuration(Date.now() - start),

    /**
     * Stop timer and return duration
     * @returns {Object} Duration info
     */
    stop: () => {
      const elapsed = Date.now() - start;
      return {
        ms: elapsed,
        formatted: formatDuration(elapsed),
      };
    },
  };
};

/**
 * Print a summary table
 * @param {Object[]} rows - Array of row objects
 * @param {string[]} columns - Column names
 */
export const printTable = (rows, columns) => {
  // Calculate column widths
  const widths = columns.map((col) =>
    Math.max(col.length, ...rows.map((row) => String(row[col] || '').length))
  );

  // Print header
  const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
  console.log(header);
  console.log('-'.repeat(header.length));

  // Print rows
  for (const row of rows) {
    const line = columns.map((col, i) => String(row[col] || '').padEnd(widths[i])).join(' | ');
    console.log(line);
  }
};

export default {
  createProgressBar,
  createMultiBar,
  logger,
  formatBytes,
  formatDuration,
  createTimer,
  printTable,
};