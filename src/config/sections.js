/**
 * Section definitions for the Neon Prompt Engine Builder
 * Each section represents a distinct part of the digital product bundle
 */

export const SECTIONS = [
  {
    id: 'core_prompts',
    label: 'Core Edition Prompts',
    defaultChunks: 12,
    description: '300 strategic prompts → 12 categories × 25 prompts',
    promptTemplate: `Generate professional, strategic prompts for business and productivity.
Focus on actionable, results-driven content that users can immediately apply.
Include prompts for: goal setting, time management, decision making, communication, and leadership.`,
  },
  {
    id: 'premium_prompts',
    label: 'Premium Edition Prompts',
    defaultChunks: 14,
    description: '700 advanced prompts → 14 chunks × 50',
    promptTemplate: `Generate advanced, specialized prompts for power users.
Include complex multi-step workflows, advanced automation triggers, and expert-level strategies.
Cover: advanced marketing, sales optimization, content creation, and business scaling.`,
  },
  {
    id: 'automation',
    label: 'Automation Workflows',
    defaultChunks: 5,
    description: '75 automation workflows → 5 chunks × 15',
    promptTemplate: `Generate detailed automation workflow templates.
Include step-by-step instructions, trigger conditions, and integration points.
Cover: email automation, social media scheduling, CRM workflows, and reporting automation.`,
  },
  {
    id: 'sales_pages',
    label: 'Sales Pages (FE, OTO1, OTO2, Downsell, Lead Magnet)',
    defaultChunks: 5,
    description: 'All funnel sales pages',
    promptTemplate: `Generate high-converting sales page copy.
Include: headlines, subheadlines, bullet points, testimonial frameworks, CTAs, and guarantee sections.
Follow proven copywriting formulas: AIDA, PAS, and story-based selling.`,
  },
  {
    id: 'thank_you',
    label: 'Thank You Pages',
    defaultChunks: 5,
    description: 'FE, OTO1, OTO2, Downsell, Lead Magnet',
    promptTemplate: `Generate thank you page content that maximizes customer satisfaction and upsell potential.
Include: confirmation messages, next steps, bonus delivery instructions, and soft upsell elements.`,
  },
  {
    id: 'launch_emails',
    label: 'Launch Email Sequences',
    defaultChunks: 2,
    description: 'Customer launch + affiliate launch',
    promptTemplate: `Generate email sequence templates for product launches.
Include: pre-launch teasers, launch day emails, urgency/scarcity emails, and post-launch follow-ups.
Cover both customer-facing and affiliate/JV partner communications.`,
  },
  {
    id: 'affiliate_toolkit',
    label: 'Affiliate Toolkit',
    defaultChunks: 4,
    description: 'JV copy, banners text, email swipes, scripts',
    promptTemplate: `Generate affiliate marketing materials.
Include: email swipes, social media posts, banner ad copy, video scripts, and promotional angles.
Make it easy for affiliates to promote with ready-to-use content.`,
  },
  {
    id: 'branding',
    label: 'Branding Docs',
    defaultChunks: 2,
    description: 'Color palette, typography, logo description',
    promptTemplate: `Generate comprehensive branding documentation.
Include: color palette specifications, typography guidelines, logo usage rules, and brand voice guidelines.
Ensure consistency across all marketing materials.`,
  },
  {
    id: 'jvzoo_docs',
    label: 'JVZoo Listing & Funnel Docs',
    defaultChunks: 3,
    description: 'Product listings, prices, funnel wiring',
    promptTemplate: `Generate JVZoo marketplace listing content.
Include: product descriptions, feature lists, pricing justifications, and funnel structure documentation.
Optimize for marketplace visibility and conversion.`,
  },
  {
    id: 'readmes',
    label: 'README & Licensing',
    defaultChunks: 3,
    description: 'README, install, license',
    promptTemplate: `Generate documentation files for the product package.
Include: installation instructions, quick start guide, FAQ, troubleshooting, and licensing terms.
Make it easy for customers to get started immediately.`,
  },
];

/**
 * Get a section by its ID
 * @param {string} id - The section ID
 * @returns {Object|undefined} The section object or undefined if not found
 */
export const getSectionById = (id) => SECTIONS.find((section) => section.id === id);

/**
 * Get all section IDs
 * @returns {string[]} Array of section IDs
 */
export const getSectionIds = () => SECTIONS.map((section) => section.id);

/**
 * Get total number of chunks across all sections
 * @returns {number} Total chunk count
 */
export const getTotalChunks = () => SECTIONS.reduce((sum, section) => sum + section.defaultChunks, 0);

/**
 * Validate section configuration
 * @param {Object} section - Section object to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export const validateSection = (section) => {
  if (!section.id || typeof section.id !== 'string') {
    throw new Error('Section must have a valid string id');
  }
  if (!section.label || typeof section.label !== 'string') {
    throw new Error('Section must have a valid string label');
  }
  if (!Number.isInteger(section.defaultChunks) || section.defaultChunks < 1) {
    throw new Error('Section must have a positive integer defaultChunks');
  }
  if (!section.description || typeof section.description !== 'string') {
    throw new Error('Section must have a valid string description');
  }
  return true;
};

export default SECTIONS;