# Neon Prompt Engine Builder

A production-ready Node.js CLI tool for generating digital product bundles with AI-powered content, branded PDFs, and automated packaging.

## Features

- 🚀 **Interactive CLI** - Inquirer-based prompts with sensible defaults
- 📊 **Progress Tracking** - Real-time progress bars for all operations
- 🤖 **AI Content Generation** - OpenAI-powered content creation with retry logic
- 📄 **Branded PDFs** - Puppeteer-based PDF generation with custom branding
- 📦 **Automated Packaging** - ZIP archives for each section and master bundle
- ⚙️ **Highly Configurable** - Override chunks, models, colors, and more

## Requirements

- Node.js 20 or newer
- OpenAI API key
- pnpm (recommended) or npm

## Installation

```bash
# Clone or download the project
cd neon-builder

# Install dependencies
pnpm install
```

## Usage

### Interactive Mode

Run the CLI and follow the prompts:

```bash
pnpm start
```

On first run, you'll be prompted to enter your OpenAI API key. The key is securely stored in `~/.config/neon-builder/credentials.json` for future use.

Or use the binary directly:

```bash
./src/index.js
```

### Configuration Options

The CLI will prompt you for:

| Option | Description | Default |
|--------|-------------|---------|
| Root Folder | Output directory name | `NeonPromptEngine` |
| Model | OpenAI model to use | `gpt-4` |
| Temperature | Generation creativity (0-2) | `0.7` |
| Generate PDFs | Create branded PDF files | `true` |
| Primary Color | Brand primary color (hex) | `#00FFC8` |
| Secondary Color | Brand secondary color (hex) | `#1a1a2e` |
| Logo URL | URL to brand logo | - |
| Footer Text | PDF footer text | `© Neon Prompt Engine` |

### API Key Management

Your OpenAI API key is stored securely in:
```
~/.config/neon-builder/credentials.json
```

The CLI will:
1. Check for `OPENAI_API_KEY` environment variable first
2. Fall back to stored credentials in `~/.config/neon-builder/`
3. Prompt you to enter a key if none is found
4. Optionally save the key for future use

### Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (overrides stored credentials) |
| `NEON_MODEL` | Override default model |
| `NEON_OUTPUT_DIR` | Override output directory |
| `NEON_VERBOSE` | Enable verbose logging (`true`/`false`) |

## Sections

The builder generates content for these sections:

| Section | Default Chunks | Description |
|---------|----------------|-------------|
| Core Prompts | 12 | 300 strategic prompts |
| Premium Prompts | 14 | 700 advanced prompts |
| Automation | 5 | 75 automation workflows |
| Sales Pages | 5 | Funnel sales pages |
| Thank You Pages | 5 | Post-purchase pages |
| Launch Emails | 2 | Email sequences |
| Affiliate Toolkit | 4 | JV/affiliate materials |
| Branding Docs | 2 | Brand guidelines |
| JVZoo Docs | 3 | Marketplace listings |
| READMEs | 3 | Documentation files |

## Output Structure

```
NeonPromptEngine/
├── core_prompts/
│   ├── chunk_01.txt
│   ├── chunk_01.pdf
│   └── ...
├── premium_prompts/
│   └── ...
├── core_prompts.zip
├── premium_prompts.zip
└── NeonPromptEngine_complete.zip
```

## Development

### Project Structure

```
neon-builder/
├── src/
│   ├── index.js           # Main CLI entry point
│   ├── config/
│   │   ├── sections.js    # Section definitions
│   │   ├── defaults.js    # Default configuration
│   │   └── index.js
│   ├── generators/
│   │   ├── content-generator.js  # OpenAI integration
│   │   ├── pdf-generator.js      # Puppeteer PDF creation
│   │   ├── zip-packager.js       # ZIP archive creation
│   │   └── index.js
│   ├── prompts/
│   │   ├── cli-prompts.js # Inquirer prompts
│   │   └── index.js
│   └── utils/
│       ├── progress.js    # Progress bars & logging
│       ├── file-system.js # File operations
│       └── index.js
├── test/
│   ├── config/
│   ├── generators/
│   └── utils/
├── package.json
├── vitest.config.js
├── eslint.config.js
└── .prettierrc
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Linting & Formatting

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues
pnpm lint:fix

# Check formatting
pnpm format:check

# Format code
pnpm format
```

## API Reference

### Content Generator

```javascript
import { createOpenAIClient, generateChunk, generateSection } from './generators/content-generator.js';

// Create client
const client = createOpenAIClient(process.env.OPENAI_API_KEY);

// Generate a single chunk
const content = await generateChunk(client, {
  model: 'gpt-4',
  temperature: 0.7,
  section: sectionConfig,
  chunkIndex: 0,
  totalChunks: 5,
  branding: brandingConfig,
});
```

### PDF Generator

```javascript
import { generateBrandedPdf, generateSectionPdfs } from './generators/pdf-generator.js';

// Generate a single PDF
await generateBrandedPdf({
  content: 'Your content here',
  outputPath: './output/document.pdf',
  title: 'Document Title',
  sectionLabel: 'Section Name',
  chunkNumber: 1,
  totalChunks: 5,
  branding: brandingConfig,
});
```

### ZIP Packager

```javascript
import { createSectionZip, createMasterZip } from './generators/zip-packager.js';

// Create section ZIP
const zipPath = await createSectionZip({
  sectionId: 'core_prompts',
  sectionDir: './output/core_prompts',
  outputDir: './output',
});

// Create master ZIP
await createMasterZip(sectionZipPaths, './output/master.zip');
```

## Dependencies

### Production

| Package | Purpose |
|---------|---------|
| `openai` | OpenAI API client |
| `inquirer` | Interactive CLI prompts |
| `cli-progress` | Progress bar display |
| `puppeteer` | PDF generation |
| `jszip` | ZIP archive creation |
| `fs-extra` | Enhanced file operations |

### Development

| Package | Purpose |
|---------|---------|
| `vitest` | Test framework |
| `@vitest/coverage-v8` | Code coverage |
| `eslint` | Code linting |
| `prettier` | Code formatting |

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Implement the feature
5. Run tests and linting
6. Submit a pull request

## Roadmap

- [ ] HTML sales page templates
- [ ] React/Next.js PDF layouts
- [ ] Image generation for banners
- [ ] License key generator
- [ ] S3 upload integration
- [ ] Resume generation on API failure
- [ ] Caching system
- [ ] GUI dashboard version