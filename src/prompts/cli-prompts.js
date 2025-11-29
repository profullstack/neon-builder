/**
 * CLI prompts module using Inquirer
 * Handles all user interaction for configuration
 */

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { SECTIONS, getSectionIds } from '../config/sections.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

/**
 * Main configuration prompts
 * @returns {Promise<Object>} User configuration answers
 */
export const askMainConfig = async () =>
  inquirer.prompt([
    {
      type: 'input',
      name: 'rootFolder',
      message: 'Root folder name for output:',
      default: DEFAULT_CONFIG.rootFolder,
      validate: (input) => {
        if (!input.trim()) {
          return 'Folder name cannot be empty';
        }
        if (/[<>:"/\\|?*]/.test(input)) {
          return 'Folder name contains invalid characters';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'model',
      message: 'OpenAI model to use:',
      default: DEFAULT_CONFIG.model,
      validate: (input) => {
        if (!input.trim()) {
          return 'Model name cannot be empty';
        }
        return true;
      },
    },
    {
      type: 'number',
      name: 'temperature',
      message: 'Generation temperature (0-2):',
      default: DEFAULT_CONFIG.temperature,
      validate: (input) => {
        if (typeof input !== 'number' || isNaN(input)) {
          return 'Temperature must be a number';
        }
        if (input < 0 || input > 2) {
          return 'Temperature must be between 0 and 2';
        }
        return true;
      },
    },
  ]);

/**
 * PDF generation prompts
 * @returns {Promise<Object>} PDF configuration answers
 */
export const askPdfConfig = async () =>
  inquirer.prompt([
    {
      type: 'confirm',
      name: 'generatePDFs',
      message: 'Generate branded PDFs using Puppeteer?',
      default: DEFAULT_CONFIG.generatePDFs,
    },
    {
      type: 'list',
      name: 'pdfFormat',
      message: 'PDF page format:',
      choices: ['A4', 'Letter', 'Legal', 'A3', 'A5'],
      default: DEFAULT_CONFIG.pdfFormat,
      when: (answers) => answers.generatePDFs,
    },
  ]);

/**
 * Branding configuration prompts
 * @returns {Promise<Object>} Branding configuration answers
 */
export const askBrandingConfig = async () =>
  inquirer.prompt([
    {
      type: 'input',
      name: 'primaryColor',
      message: 'Brand primary color (hex):',
      default: DEFAULT_CONFIG.branding.primaryColor,
      validate: (input) => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(input)) {
          return 'Please enter a valid hex color (e.g., #00FFC8)';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'secondaryColor',
      message: 'Brand secondary color (hex):',
      default: DEFAULT_CONFIG.branding.secondaryColor,
      validate: (input) => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(input)) {
          return 'Please enter a valid hex color (e.g., #1a1a2e)';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'logoPath',
      message: 'Logo (URL or file path, leave empty for none):',
      default: '',
      validate: async (input) => {
        if (!input.trim()) {
          return true; // Empty is allowed
        }
        // Check if it's a URL
        if (input.startsWith('http://') || input.startsWith('https://')) {
          return true;
        }
        // Check if it's a valid file path
        const resolvedPath = path.resolve(process.cwd(), input);
        if (await fs.pathExists(resolvedPath)) {
          const ext = path.extname(resolvedPath).toLowerCase();
          if (['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'].includes(ext)) {
            return true;
          }
          return 'File must be an image (png, jpg, svg, gif, webp)';
        }
        return 'File not found. Enter a valid URL or file path.';
      },
    },
    {
      type: 'input',
      name: 'footerText',
      message: 'Footer text for PDFs:',
      default: DEFAULT_CONFIG.branding.footerText,
    },
  ]);

/**
 * Section selection prompts
 * @returns {Promise<Object>} Section selection answers
 */
export const askSectionSelection = async () =>
  inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedSections',
      message: 'Select sections to generate:',
      choices: SECTIONS.map((section) => ({
        name: `${section.label} (${section.defaultChunks} chunks) - ${section.description}`,
        value: section.id,
        checked: true,
      })),
      validate: (input) => {
        if (input.length === 0) {
          return 'Please select at least one section';
        }
        return true;
      },
    },
  ]);

/**
 * Chunk override prompts for selected sections
 * @param {string[]} selectedSectionIds - Array of selected section IDs
 * @returns {Promise<Object>} Chunk override answers
 */
export const askChunkOverrides = async (selectedSectionIds) => {
  const selectedSections = SECTIONS.filter((s) => selectedSectionIds.includes(s.id));

  const questions = selectedSections.map((section) => ({
    type: 'number',
    name: section.id,
    message: `Number of chunks for "${section.label}":`,
    default: section.defaultChunks,
    validate: (input) => {
      if (!Number.isInteger(input) || input < 1) {
        return 'Please enter a positive integer';
      }
      if (input > 100) {
        return 'Maximum 100 chunks per section';
      }
      return true;
    },
  }));

  return inquirer.prompt(questions);
};

/**
 * Advanced options prompts
 * @returns {Promise<Object>} Advanced options answers
 */
export const askAdvancedOptions = async () =>
  inquirer.prompt([
    {
      type: 'confirm',
      name: 'showAdvanced',
      message: 'Configure advanced options?',
      default: false,
    },
    {
      type: 'number',
      name: 'maxRetries',
      message: 'Max API retries on failure:',
      default: DEFAULT_CONFIG.maxRetries,
      when: (answers) => answers.showAdvanced,
      validate: (input) => {
        if (!Number.isInteger(input) || input < 0) {
          return 'Please enter a non-negative integer';
        }
        return true;
      },
    },
    {
      type: 'number',
      name: 'retryDelay',
      message: 'Retry delay in milliseconds:',
      default: DEFAULT_CONFIG.retryDelay,
      when: (answers) => answers.showAdvanced,
      validate: (input) => {
        if (!Number.isInteger(input) || input < 0) {
          return 'Please enter a non-negative integer';
        }
        return true;
      },
    },
    {
      type: 'confirm',
      name: 'verboseLogging',
      message: 'Enable verbose logging?',
      default: DEFAULT_CONFIG.verboseLogging,
      when: (answers) => answers.showAdvanced,
    },
    {
      type: 'confirm',
      name: 'includeSourceFiles',
      message: 'Include source .txt files in ZIP?',
      default: DEFAULT_CONFIG.includeSourceFiles,
      when: (answers) => answers.showAdvanced,
    },
  ]);

/**
 * Confirmation prompt before starting generation
 * @param {Object} config - Final configuration object
 * @returns {Promise<Object>} Confirmation answer
 */
export const askConfirmation = async (config) => {
  console.log('\n📋 Configuration Summary:');
  console.log('─'.repeat(50));
  console.log(`  Output folder: ${config.rootFolder}`);
  console.log(`  Model: ${config.model}`);
  console.log(`  Temperature: ${config.temperature}`);
  console.log(`  Generate PDFs: ${config.generatePDFs ? 'Yes' : 'No'}`);
  console.log(`  Sections: ${config.selectedSections?.length || 'All'}`);
  console.log(`  Primary color: ${config.branding?.primaryColor || config.primaryColor}`);
  console.log('─'.repeat(50));

  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with generation?',
      default: true,
    },
  ]);
};

/**
 * Run all prompts in sequence and return merged configuration
 * @returns {Promise<Object>} Complete configuration object
 */
export const runAllPrompts = async () => {
  console.log('\n🚀 Neon Prompt Engine Builder\n');
  console.log('Press Enter to accept defaults, or type your own values.\n');

  const mainConfig = await askMainConfig();
  const pdfConfig = await askPdfConfig();
  const brandingConfig = await askBrandingConfig();
  const sectionSelection = await askSectionSelection();
  const chunkOverrides = await askChunkOverrides(sectionSelection.selectedSections);
  const advancedOptions = await askAdvancedOptions();

  // Process logo path - convert local file to data URI if needed
  let logoUrl = brandingConfig.logoPath || '';
  let logoIsLocal = false;
  
  if (logoUrl && !logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
    logoIsLocal = true;
    // Store the resolved path - will be converted to data URI during PDF generation
    logoUrl = path.resolve(process.cwd(), logoUrl);
  }

  const config = {
    ...mainConfig,
    ...pdfConfig,
    branding: {
      primaryColor: brandingConfig.primaryColor,
      secondaryColor: brandingConfig.secondaryColor,
      logoUrl,
      logoIsLocal,
      footerText: brandingConfig.footerText,
    },
    selectedSections: sectionSelection.selectedSections,
    chunkOverrides,
    ...advancedOptions,
  };

  const confirmation = await askConfirmation(config);

  if (!confirmation.proceed) {
    console.log('\n❌ Generation cancelled by user.\n');
    process.exit(0);
  }

  return config;
};

export default {
  askMainConfig,
  askPdfConfig,
  askBrandingConfig,
  askSectionSelection,
  askChunkOverrides,
  askAdvancedOptions,
  askConfirmation,
  runAllPrompts,
};