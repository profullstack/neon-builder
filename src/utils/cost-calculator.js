/**
 * Cost calculation utility for OpenAI API usage
 * Pricing based on OpenAI's current rates (as of 2024)
 */

/**
 * OpenAI model pricing per 1K tokens (in USD)
 * Updated pricing - check https://openai.com/pricing for latest rates
 */
export const MODEL_PRICING = {
  // GPT-4 Turbo
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4-1106-preview': { input: 0.01, output: 0.03 },
  'gpt-4-0125-preview': { input: 0.01, output: 0.03 },

  // GPT-4
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-0613': { input: 0.03, output: 0.06 },
  'gpt-4-32k': { input: 0.06, output: 0.12 },
  'gpt-4-32k-0613': { input: 0.06, output: 0.12 },

  // GPT-4o
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-2024-05-13': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o-mini-2024-07-18': { input: 0.00015, output: 0.0006 },

  // GPT-3.5 Turbo
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-0125': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-1106': { input: 0.001, output: 0.002 },
  'gpt-3.5-turbo-instruct': { input: 0.0015, output: 0.002 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
};

/**
 * Default pricing for unknown models (conservative estimate)
 */
const DEFAULT_PRICING = { input: 0.03, output: 0.06 };

/**
 * Get pricing for a specific model
 * @param {string} model - Model name
 * @returns {{input: number, output: number}} Pricing per 1K tokens
 */
export const getModelPricing = (model) => {
  // Try exact match first
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }

  // Try prefix matching for versioned models
  const modelLower = model.toLowerCase();
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelLower.startsWith(key) || key.startsWith(modelLower)) {
      return pricing;
    }
  }

  // Return default pricing for unknown models
  return DEFAULT_PRICING;
};

/**
 * Calculate cost for token usage
 * @param {Object} usage - Token usage object
 * @param {number} usage.promptTokens - Number of input/prompt tokens
 * @param {number} usage.completionTokens - Number of output/completion tokens
 * @param {string} model - Model name
 * @returns {number} Cost in USD
 */
export const calculateCost = (usage, model) => {
  const pricing = getModelPricing(model);
  const inputCost = (usage.promptTokens / 1000) * pricing.input;
  const outputCost = (usage.completionTokens / 1000) * pricing.output;
  return inputCost + outputCost;
};

/**
 * Format cost as currency string
 * @param {number} cost - Cost in USD
 * @returns {string} Formatted cost string
 */
export const formatCost = (cost) => {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
};

/**
 * Create a cost tracker for accumulating costs across multiple API calls
 * @param {string} model - Model name for pricing
 * @returns {Object} Cost tracker object
 */
export const createCostTracker = (model) => {
  let totalUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  let totalCost = 0;

  return {
    /**
     * Add usage from an API call
     * @param {Object} usage - Token usage from API response
     */
    addUsage(usage) {
      totalUsage.promptTokens += usage.promptTokens || 0;
      totalUsage.completionTokens += usage.completionTokens || 0;
      totalUsage.totalTokens += usage.totalTokens || 0;
      totalCost = calculateCost(totalUsage, model);
    },

    /**
     * Get current total cost
     * @returns {number} Total cost in USD
     */
    getTotalCost() {
      return totalCost;
    },

    /**
     * Get formatted total cost
     * @returns {string} Formatted cost string
     */
    getFormattedCost() {
      return formatCost(totalCost);
    },

    /**
     * Get total token usage
     * @returns {Object} Total usage object
     */
    getTotalUsage() {
      return { ...totalUsage };
    },

    /**
     * Get summary of costs and usage
     * @returns {Object} Summary object
     */
    getSummary() {
      const pricing = getModelPricing(model);
      return {
        model,
        pricing,
        usage: { ...totalUsage },
        cost: totalCost,
        formattedCost: formatCost(totalCost),
        breakdown: {
          inputCost: (totalUsage.promptTokens / 1000) * pricing.input,
          outputCost: (totalUsage.completionTokens / 1000) * pricing.output,
        },
      };
    },
  };
};

export default {
  MODEL_PRICING,
  getModelPricing,
  calculateCost,
  formatCost,
  createCostTracker,
};