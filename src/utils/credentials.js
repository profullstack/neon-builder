/**
 * Credentials management module
 * Stores and retrieves API keys from ~/.config/neon-builder/
 */

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'neon-builder');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, 'credentials.json');

/**
 * Ensure the config directory exists
 * @returns {Promise<void>}
 */
export const ensureConfigDir = async () => {
  await fs.ensureDir(CONFIG_DIR);
};

/**
 * Load credentials from file
 * @returns {Promise<Object>} Credentials object
 */
export const loadCredentials = async () => {
  try {
    await ensureConfigDir();
    if (await fs.pathExists(CREDENTIALS_FILE)) {
      const content = await fs.readFile(CREDENTIALS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('Warning: Could not load credentials file:', error.message);
  }
  return {};
};

/**
 * Save credentials to file
 * @param {Object} credentials - Credentials object
 * @returns {Promise<void>}
 */
export const saveCredentials = async (credentials) => {
  await ensureConfigDir();
  await fs.writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
    mode: 0o600, // Read/write for owner only
  });
};

/**
 * Get OpenAI API key from stored credentials or environment
 * @returns {Promise<string|null>} API key or null if not found
 */
export const getOpenAIKey = async () => {
  // First check environment variable
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // Then check stored credentials
  const credentials = await loadCredentials();
  return credentials.openaiApiKey || null;
};

/**
 * Store OpenAI API key
 * @param {string} apiKey - The API key to store
 * @returns {Promise<void>}
 */
export const setOpenAIKey = async (apiKey) => {
  const credentials = await loadCredentials();
  credentials.openaiApiKey = apiKey;
  await saveCredentials(credentials);
};

/**
 * Remove stored OpenAI API key
 * @returns {Promise<void>}
 */
export const removeOpenAIKey = async () => {
  const credentials = await loadCredentials();
  delete credentials.openaiApiKey;
  await saveCredentials(credentials);
};

/**
 * Prompt user for OpenAI API key
 * @returns {Promise<string>} The entered API key
 */
export const promptForOpenAIKey = async () => {
  console.log('\n🔑 OpenAI API Key Required\n');
  console.log('Your API key will be stored securely in:');
  console.log(`  ${CREDENTIALS_FILE}\n`);
  console.log('You can get an API key from: https://platform.openai.com/api-keys\n');

  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your OpenAI API key:',
      mask: '*',
      validate: (input) => {
        if (!input.trim()) {
          return 'API key cannot be empty';
        }
        if (!input.startsWith('sk-')) {
          return 'Invalid API key format. OpenAI keys start with "sk-"';
        }
        return true;
      },
    },
  ]);

  const { saveKey } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'saveKey',
      message: 'Save this API key for future use?',
      default: true,
    },
  ]);

  if (saveKey) {
    await setOpenAIKey(apiKey);
    console.log('\n✅ API key saved successfully!\n');
  }

  return apiKey;
};

/**
 * Ensure we have an OpenAI API key, prompting if necessary
 * @returns {Promise<string>} The API key
 */
export const ensureOpenAIKey = async () => {
  let apiKey = await getOpenAIKey();

  if (!apiKey) {
    apiKey = await promptForOpenAIKey();
  }

  return apiKey;
};

/**
 * Get the config directory path
 * @returns {string} Config directory path
 */
export const getConfigDir = () => CONFIG_DIR;

/**
 * Get the credentials file path
 * @returns {string} Credentials file path
 */
export const getCredentialsFile = () => CREDENTIALS_FILE;

export default {
  ensureConfigDir,
  loadCredentials,
  saveCredentials,
  getOpenAIKey,
  setOpenAIKey,
  removeOpenAIKey,
  promptForOpenAIKey,
  ensureOpenAIKey,
  getConfigDir,
  getCredentialsFile,
};