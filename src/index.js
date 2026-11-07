#!/usr/bin/env node

/**
 * Neon Prompt Engine Builder - Main CLI Entry Point
 * A production-ready CLI tool for generating digital product bundles
 */

import { runAllPrompts } from './prompts/index.js';
import { SECTIONS, getSectionById, mergeConfig, getEnvConfig } from './config/index.js';
import {
  createOpenAIClient,
  generateChunk,
  generateSectionPdfs,
  createSectionZip,
  createMasterZip,
  checkPuppeteerInstallation,
} from './generators/index.js';
import { isC0mputeDisabled } from './generators/c0mpute.js';
import {
  createProgressBar,
  logger,
  formatBytes,
  formatDuration,
  createTimer,
  ensureDirectory,
  writeFile,
  getDirectorySize,
  ensureOpenAIKey,
  getOpenAIKey,
  getConfigDir,
  createCostTracker,
} from './utils/index.js';

/**
 * Display welcome banner
 */
const displayBanner = () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███╗   ██╗███████╗ ██████╗ ███╗   ██╗                      ║
║   ████╗  ██║██╔════╝██╔═══██╗████╗  ██║                      ║
║   ██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║                      ║
║   ██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║                      ║
║   ██║ ╚████║███████╗╚██████╔╝██║ ╚████║                      ║
║   ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝                      ║
║                                                               ║
║   PROMPT ENGINE BUILDER v1.0.0                               ║
║   Digital Product Generation CLI                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
};

/**
 * Check prerequisites before running
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<boolean>} True if all prerequisites are met
 */
const checkPrerequisites = async (apiKey) => {
  logger.section('Checking Prerequisites');

  // c0mpute first; OpenAI is required only when C0MPUTE_DISABLED is set
  if (!isC0mputeDisabled()) {
    logger.success(
      `c0mpute first${process.env.C0MPUTE_API_KEY ? '' : ' (no C0MPUTE_API_KEY: free tier, 10 calls a day)'}`
    );
    logger.info(apiKey ? 'OpenAI API key configured as fallback' : 'No OpenAI fallback key');
  } else if (!apiKey) {
    logger.error('OpenAI API key is required');
    return false;
  } else {
    logger.success('OpenAI API key configured');
  }

  // Check Puppeteer installation
  logger.info('Checking Puppeteer installation...');
  const puppeteerOk = await checkPuppeteerInstallation();
  if (!puppeteerOk) {
    logger.warn('Puppeteer check failed - PDF generation may not work');
    logger.info('Try running: pnpm install puppeteer');
  } else {
    logger.success('Puppeteer is ready');
  }

  return true;
};

/**
 * Process a single section
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Section results
 */
const processSection = async (options) => {
  const { client, section, numChunks, config, outputDir, progressBar, costTracker } = options;

  const sectionDir = `${outputDir}/${section.id}`;
  await ensureDirectory(sectionDir);

  const contents = [];

  // Generate content chunks (collect in memory, don't write individual files)
  for (let i = 0; i < numChunks; i++) {
    const { content, usage } = await generateChunk(client, {
      model: config.model,
      temperature: config.temperature,
      section,
      chunkIndex: i,
      totalChunks: numChunks,
      branding: config.branding,
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    });

    contents.push(content);

    // Track cost
    costTracker.addUsage(usage);

    progressBar.increment({
      task: `${section.label} - Chunk ${i + 1}/${numChunks}`,
      cost: costTracker.getFormattedCost(),
    });
  }

  // Combine all chunks into a single file for this section
  const combinedContent = contents.join('\n\n---\n\n');
  const combinedTxtPath = `${sectionDir}/${section.id}.txt`;
  await writeFile(combinedTxtPath, combinedContent);

  // Generate single combined PDF if enabled
  let pdfPath = null;
  if (config.generatePDFs) {
    const pdfPaths = await generateSectionPdfs({
      contents: [combinedContent],
      outputDir: sectionDir,
      sectionId: section.id,
      sectionLabel: section.label,
      branding: config.branding,
    });
    pdfPath = pdfPaths[0] || null;
  }

  // Create section ZIP (only include PDFs, not source txt files)
  const zipPath = await createSectionZip({
    sectionId: section.id,
    sectionDir,
    outputDir,
    includeSourceFiles: false,
    includePdfs: config.generatePDFs,
  });

  return {
    sectionId: section.id,
    sectionLabel: section.label,
    numChunks,
    txtPath: combinedTxtPath,
    pdfPath,
    zipPath,
  };
};

/**
 * Main build function
 * @param {Object} config - Build configuration
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Object>} Build results
 */
const build = async (config, apiKey) => {
  const timer = createTimer();
  const envConfig = getEnvConfig();
  const mergedConfig = mergeConfig({ ...config, ...envConfig });

  // OpenAI client: the fallback behind c0mpute (none without a key)
  const client = apiKey ? createOpenAIClient(apiKey) : null;

  // Setup output directory - use outputDir/rootFolder structure
  const baseOutputDir = mergedConfig.outputDir || './dist';
  const outputDir = `${process.cwd()}/${baseOutputDir}/${mergedConfig.rootFolder}`;
  await ensureDirectory(outputDir);

  logger.section('Starting Generation');
  logger.info(`Output directory: ${outputDir}`);
  logger.info(`Model: ${mergedConfig.model}`);
  logger.info(`Temperature: ${mergedConfig.temperature}`);
  logger.info(`Generate PDFs: ${mergedConfig.generatePDFs ? 'Yes' : 'No'}`);

  // Calculate total work
  const selectedSections = mergedConfig.selectedSections || SECTIONS.map((s) => s.id);
  const chunkOverrides = mergedConfig.chunkOverrides || {};

  let totalChunks = 0;
  const sectionWork = [];

  for (const sectionId of selectedSections) {
    const section = getSectionById(sectionId);
    if (section) {
      const numChunks = chunkOverrides[sectionId] || section.defaultChunks;
      totalChunks += numChunks;
      sectionWork.push({ section, numChunks });
    }
  }

  logger.info(`Sections to process: ${sectionWork.length}`);
  logger.info(`Total chunks to generate: ${totalChunks}`);
  logger.blank();

  // Create cost tracker
  const costTracker = createCostTracker(mergedConfig.model);

  // Create progress bar with cost display
  const progressBar = createProgressBar({
    format: '{bar} {percentage}% | {value}/{total} chunks | Cost: {cost} | {task}',
  });
  progressBar.start(totalChunks, 0, { task: 'Starting...', cost: '$0.00' });

  // Process each section
  const results = [];
  const zipPaths = [];

  for (const { section, numChunks } of sectionWork) {
    try {
      const result = await processSection({
        client,
        section,
        numChunks,
        config: mergedConfig,
        outputDir,
        progressBar,
        costTracker,
      });

      results.push(result);
      zipPaths.push(result.zipPath);
    } catch (error) {
      progressBar.stop();
      logger.error(`Failed to process section "${section.label}": ${error.message}`);
      throw error;
    }
  }

  progressBar.stop();

  // Create master ZIP
  logger.blank();
  logger.info('Creating master ZIP archive...');

  const masterZipPath = `${outputDir}/${mergedConfig.rootFolder}_complete.zip`;
  await createMasterZip(zipPaths, masterZipPath);

  // Calculate statistics
  const totalSize = await getDirectorySize(outputDir);
  const duration = timer.stop();
  const costSummary = costTracker.getSummary();

  return {
    outputDir,
    masterZipPath,
    sections: results,
    stats: {
      totalSections: results.length,
      totalChunks,
      totalSize,
      duration: duration.ms,
    },
    cost: costSummary,
  };
};

/**
 * Display build results summary
 * @param {Object} results - Build results
 */
const displaySummary = (results) => {
  logger.section('Build Complete!');

  console.log('📁 Output Directory:', results.outputDir);
  console.log('📦 Master ZIP:', results.masterZipPath);
  console.log('');
  console.log('📊 Statistics:');
  console.log(`   Sections: ${results.stats.totalSections}`);
  console.log(`   Chunks: ${results.stats.totalChunks}`);
  console.log(`   Total Size: ${formatBytes(results.stats.totalSize)}`);
  console.log(`   Duration: ${formatDuration(results.stats.duration)}`);
  console.log('');

  // Display cost breakdown
  if (results.cost) {
    console.log('💰 OpenAI API Cost:');
    console.log(`   Model: ${results.cost.model}`);
    console.log(`   Input tokens: ${results.cost.usage.promptTokens.toLocaleString()}`);
    console.log(`   Output tokens: ${results.cost.usage.completionTokens.toLocaleString()}`);
    console.log(`   Total tokens: ${results.cost.usage.totalTokens.toLocaleString()}`);
    console.log(`   Total Cost: ${results.cost.formattedCost}`);
    console.log('');
  }

  console.log('📋 Generated Files:');

  for (const section of results.sections) {
    console.log(`   ✅ ${section.sectionLabel}`);
    console.log(`      ├─ ${section.numChunks} chunks combined`);
    console.log(`      ├─ Text: ${section.txtPath}`);
    if (section.pdfPath) {
      console.log(`      ├─ PDF: ${section.pdfPath}`);
    }
    console.log(`      └─ ZIP: ${section.zipPath}`);
  }

  console.log('');
  console.log('🎉 Your digital product bundle is ready!');
};

/**
 * Main entry point
 */
const main = async () => {
  try {
    displayBanner();

    // Get the OpenAI fallback key (prompted for only when c0mpute is off)
    logger.info(`Config directory: ${getConfigDir()}`);
    // c0mpute needs no key; prompt for OpenAI only when c0mpute is disabled
    const apiKey = isC0mputeDisabled() ? await ensureOpenAIKey() : await getOpenAIKey();

    // Check prerequisites
    const prereqOk = await checkPrerequisites(apiKey);
    if (!prereqOk) {
      process.exit(1);
    }

    // Run interactive prompts
    const config = await runAllPrompts();

    // Build the product
    const results = await build(config, apiKey);

    // Display summary
    displaySummary(results);

    process.exit(0);
  } catch (error) {
    logger.blank();
    logger.error(`Build failed: ${error.message}`);

    if (process.env.NEON_VERBOSE === 'true') {
      console.error(error.stack);
    }

    process.exit(1);
  }
};

// Run main function
main();

export { build, checkPrerequisites, displayBanner, displaySummary };