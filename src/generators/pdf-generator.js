/**
 * PDF generation module using Puppeteer
 * Creates branded PDF documents from content
 */

import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';

/**
 * Default PDF options
 */
const DEFAULT_PDF_OPTIONS = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '40px',
    right: '40px',
    bottom: '60px',
    left: '40px',
  },
};

/**
 * Get MIME type from file extension
 * @param {string} filePath - File path
 * @returns {string} MIME type
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  return mimeTypes[ext] || 'image/png';
};

/**
 * Convert a local file to a base64 data URI
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} Base64 data URI
 */
export const fileToDataUri = async (filePath) => {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  
  if (!(await fs.pathExists(absolutePath))) {
    throw new Error(`Logo file not found: ${absolutePath}`);
  }
  
  const buffer = await fs.readFile(absolutePath);
  const base64 = buffer.toString('base64');
  const mimeType = getMimeType(absolutePath);
  
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Resolve logo URL - converts local paths to data URIs
 * @param {Object} branding - Branding configuration
 * @returns {Promise<string>} Resolved logo URL (data URI or original URL)
 */
export const resolveLogoUrl = async (branding) => {
  const { logoUrl = '', logoIsLocal = false } = branding;
  
  if (!logoUrl) {
    return '';
  }
  
  // If it's marked as local or doesn't start with http, convert to data URI
  if (logoIsLocal || (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://') && !logoUrl.startsWith('data:'))) {
    try {
      return await fileToDataUri(logoUrl);
    } catch (error) {
      console.warn(`Warning: Could not load logo file: ${error.message}`);
      return '';
    }
  }
  
  return logoUrl;
};

/**
 * Generate HTML template for PDF content
 * @param {Object} options - Template options
 * @param {string} options.title - Document title
 * @param {string} options.content - Main content (can be markdown or plain text)
 * @param {Object} options.branding - Branding configuration
 * @param {string} options.sectionLabel - Section label
 * @param {number} options.chunkNumber - Chunk number
 * @param {number} options.totalChunks - Total chunks in section
 * @param {string} options.resolvedLogoUrl - Pre-resolved logo URL (data URI or URL)
 * @returns {string} HTML string
 */
export const generateHtmlTemplate = (options) => {
  const { title, content, branding, sectionLabel, chunkNumber, totalChunks, resolvedLogoUrl } = options;

  const {
    primaryColor = '#00FFC8',
    secondaryColor = '#1a1a2e',
    textColor = '#ffffff',
    footerText = '© Neon Prompt Engine',
    fontFamily = 'Arial, Helvetica, sans-serif',
  } = branding;

  // Use resolved logo URL if provided, otherwise fall back to branding.logoUrl
  const logoUrl = resolvedLogoUrl ?? branding.logoUrl ?? '';

  // Escape HTML in content but preserve line breaks
  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${fontFamily};
      background: linear-gradient(135deg, ${secondaryColor} 0%, #0f0f23 100%);
      color: ${textColor};
      min-height: 100vh;
      padding: 40px;
      line-height: 1.6;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 40px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${primaryColor};
    }
    
    .logo {
      max-width: 180px;
      max-height: 60px;
      object-fit: contain;
    }
    
    .logo-placeholder {
      width: 180px;
      height: 60px;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      color: ${secondaryColor};
    }
    
    .chunk-info {
      text-align: right;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
    
    h1 {
      color: ${primaryColor};
      font-size: 28px;
      margin-bottom: 10px;
      text-shadow: 0 0 20px ${primaryColor}40;
    }
    
    .section-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 30px;
    }
    
    .content {
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .content h2, .content h3 {
      color: ${primaryColor};
      margin-top: 24px;
      margin-bottom: 12px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .footer-brand {
      color: ${primaryColor};
      font-weight: bold;
    }
    
    @media print {
      body {
        background: white;
        color: #333;
      }
      
      .container {
        background: white;
        border: none;
        box-shadow: none;
      }
      
      h1 {
        color: ${primaryColor};
        text-shadow: none;
      }
      
      .content {
        color: #333;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${
        logoUrl
          ? `<img src="${logoUrl}" alt="Logo" class="logo" onerror="this.style.display='none'">`
          : `<div class="logo-placeholder">NEON</div>`
      }
      <div class="chunk-info">
        Part ${chunkNumber} of ${totalChunks}
      </div>
    </div>
    
    <h1>${title}</h1>
    <div class="section-label">${sectionLabel}</div>
    
    <div class="content">${escapedContent}</div>
    
    <div class="footer">
      <span class="footer-brand">${footerText}</span>
      <br>
      Generated with Neon Prompt Engine Builder
    </div>
  </div>
</body>
</html>`;
};

/**
 * Create a PDF from HTML content
 * @param {string} html - HTML content
 * @param {string} outputPath - Output file path
 * @param {Object} pdfOptions - PDF generation options
 * @returns {Promise<void>}
 */
export const createPdfFromHtml = async (html, outputPath, pdfOptions = {}) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const options = {
      ...DEFAULT_PDF_OPTIONS,
      ...pdfOptions,
      path: outputPath,
    };

    await page.pdf(options);
  } finally {
    await browser.close();
  }
};

/**
 * Generate a branded PDF from content
 * @param {Object} options - Generation options
 * @param {string} options.content - Content to include in PDF
 * @param {string} options.outputPath - Output file path
 * @param {string} options.title - Document title
 * @param {string} options.sectionLabel - Section label
 * @param {number} options.chunkNumber - Chunk number
 * @param {number} options.totalChunks - Total chunks
 * @param {Object} options.branding - Branding configuration
 * @param {Object} options.pdfOptions - Additional PDF options
 * @param {string} options.resolvedLogoUrl - Pre-resolved logo URL (optional)
 * @returns {Promise<void>}
 */
export const generateBrandedPdf = async (options) => {
  const {
    content,
    outputPath,
    title,
    sectionLabel,
    chunkNumber,
    totalChunks,
    branding,
    pdfOptions = {},
    resolvedLogoUrl,
  } = options;

  // Resolve logo URL if not already provided
  const logoUrl = resolvedLogoUrl ?? (await resolveLogoUrl(branding));

  const html = generateHtmlTemplate({
    title,
    content,
    branding,
    sectionLabel,
    chunkNumber,
    totalChunks,
    resolvedLogoUrl: logoUrl,
  });

  await createPdfFromHtml(html, outputPath, pdfOptions);
};

/**
 * Generate multiple PDFs for a section
 * @param {Object} options - Generation options
 * @param {string[]} options.contents - Array of content strings
 * @param {string} options.outputDir - Output directory
 * @param {string} options.sectionId - Section ID for filename
 * @param {string} options.sectionLabel - Section label for display
 * @param {Object} options.branding - Branding configuration
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<string[]>} Array of generated PDF paths
 */
export const generateSectionPdfs = async (options) => {
  const { contents, outputDir, sectionId, sectionLabel, branding, onProgress } = options;

  // Resolve logo URL once for all PDFs in this section
  const resolvedLogoUrl = await resolveLogoUrl(branding);

  const pdfPaths = [];

  for (let i = 0; i < contents.length; i++) {
    const chunkNumber = i + 1;
    const filename = `${sectionId}_chunk_${String(chunkNumber).padStart(2, '0')}.pdf`;
    const outputPath = `${outputDir}/${filename}`;

    await generateBrandedPdf({
      content: contents[i],
      outputPath,
      title: `${sectionLabel} - Part ${chunkNumber}`,
      sectionLabel,
      chunkNumber,
      totalChunks: contents.length,
      branding,
      resolvedLogoUrl,
    });

    pdfPaths.push(outputPath);

    if (onProgress) {
      onProgress(i, outputPath);
    }
  }

  return pdfPaths;
};

/**
 * Check if Puppeteer is properly installed and working
 * @returns {Promise<boolean>} True if Puppeteer is working
 */
export const checkPuppeteerInstallation = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    await browser.close();
    return true;
  } catch (error) {
    console.error('Puppeteer check failed:', error.message);
    return false;
  }
};

export default {
  generateHtmlTemplate,
  createPdfFromHtml,
  generateBrandedPdf,
  generateSectionPdfs,
  checkPuppeteerInstallation,
  fileToDataUri,
  resolveLogoUrl,
};