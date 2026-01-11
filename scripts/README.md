# Content Generation Scripts

Automated content generation for Foxxe Labs using Claude API.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get your Anthropic API key:**
   - Go to https://console.anthropic.com/
   - Create an API key
   - Keep it secret!

3. **Set environment variable:**
   
   **macOS/Linux:**
   ```bash
   export ANTHROPIC_API_KEY="your-key-here"
   ```
   
   **Or add to your shell profile** (~/.zshrc or ~/.bashrc):
   ```bash
   echo 'export ANTHROPIC_API_KEY="your-key-here"' >> ~/.zshrc
   source ~/.zshrc
   ```
   
   **Windows (PowerShell):**
   ```powershell
   $env:ANTHROPIC_API_KEY="your-key-here"
   ```

## Usage

### Generate News Posts

Search for recent AI news and generate 1-3 posts:

```bash
npm run generate-news
```

This will:
- Search configured topics (see `scripts/config.json`)
- Generate posts with proper formatting
- Save as **drafts** in `src/content/news/`
- Include sources and citations

### Generate Resource Posts

Create an in-depth resource on a specific topic:

```bash
npm run generate-resource "your topic here"
```

Examples:
```bash
npm run generate-resource "AI model fine-tuning techniques"
npm run generate-resource "Vector database comparison"
npm run generate-resource "LLM evaluation metrics"
```

This will:
- Search for current information on the topic
- Generate a comprehensive guide (1500-2000 words)
- Follow the Foxxe Labs resource structure
- Save as **draft** in `src/content/resources/`

## Configuration

Edit `scripts/config.json` to customize:

```json
{
  "topics": [
    "AI security vulnerabilities",
    "LLM model releases",
    // Add your topics here
  ],
  "daysBack": 7,        // How far back to search
  "maxPosts": 3,        // Max news posts per run
  "style": {
    "tone": "Professional but conversational",
    "approach": "Practical and actionable"
  }
}
```

## Workflow

1. **Generate content:**
   ```bash
   npm run generate-news
   # or
   npm run generate-resource "topic"
   ```

2. **Review drafts:**
   - Open `src/content/news/` or `src/content/resources/`
   - Read the generated content
   - Edit as needed (fix errors, add insights, adjust tone)

3. **Publish:**
   - Change `draft: true` to `draft: false` in frontmatter
   - Save the file
   - Commit to git
   - Deploy (Cloudflare Pages will auto-rebuild)

## What Gets Generated

### News Posts Include:
- Title and description
- Proper category and tags
- Source attribution
- Key developments
- Industry context
- Practical implications
- Open questions

### Resource Posts Include:
- Comprehensive title and description
- Category, tags, reading time
- Further reading sources
- Full structure:
  - Why This Matters
  - The Map (framework/taxonomy)
  - Practical Uses
  - Tradeoffs & Failure Modes
  - What Changed Recently
  - What to Watch Next
  - Foxxe Take

## Tips

- **Run regularly:** `npm run generate-news` weekly to keep content fresh
- **Review everything:** AI-generated content should always be reviewed
- **Edit freely:** Add your voice, fix errors, expand sections
- **Keep config updated:** Adjust topics in config.json as your focus shifts
- **Batch generation:** Run multiple times if you need more content

## Cost Estimates

Using Claude Sonnet 4:
- **News post:** ~$0.05-0.10 per post
- **Resource post:** ~$0.15-0.30 per post
- **Weekly batch (3 news):** ~$0.20-0.40/week

## Troubleshooting

**"ANTHROPIC_API_KEY not set"**
- Make sure you exported the environment variable
- Check with: `echo $ANTHROPIC_API_KEY`

**"Failed to extract JSON"**
- Usually means the API response format changed
- Check `scripts/generate-content.js` and update prompt if needed

**"File already exists"**
- Script adds timestamp suffix to avoid overwrites
- Review existing file before generating on same topic

**Rate limits**
- Script includes 1-second delay between requests
- If you hit limits, wait a few minutes

## Advanced: Automation

Want to run this automatically? Options:

1. **Cron job (macOS/Linux):**
   ```bash
   # Run every Monday at 9am
   0 9 * * 1 cd /path/to/project && npm run generate-news
   ```

2. **GitHub Action:** (Not included yet)
   - Can set up to run on schedule
   - Creates PR with new content
   - You review and merge

3. **Manual is fine too!**
   - Just run when you want new content
   - Full control over timing

## Questions?

Check the main README.md or contact for help.
