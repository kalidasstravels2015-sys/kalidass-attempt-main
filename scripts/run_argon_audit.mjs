import fs from 'node:fs';
import path from 'node:path';

// 1. Load GEMINI_API_KEY from .env
const envPath = path.resolve(process.cwd(), '.env');
let apiKey = process.env.GEMINI_API_KEY;
if (!apiKey && fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, 'utf8').match(/GEMINI_API_KEY\s*=\s*(.+)/);
  if (match) apiKey = match[1].trim();
}

if (!apiKey) {
  console.error('❌ Error: GEMINI_API_KEY not found in .env or environment');
  process.exit(1);
}

console.log('================================================================');
console.log('🤖 GEMINI 4 ARGON DEEP REASONING SITE AUDITOR');
console.log('Auditing: Schema.org | Logics & Pricing | SERP/AEO | M3 UI/UX');
console.log('================================================================\n');

// 2. Collect files to audit
const layoutPath = path.resolve(process.cwd(), 'src/layouts/Layout.astro');
const breadcrumbsPath = path.resolve(process.cwd(), 'src/components/SEO/Breadcrumbs.astro');
const faqPath = path.resolve(process.cwd(), 'src/components/FAQ.astro');
const slugPagePath = path.resolve(process.cwd(), 'src/pages/services/[slug].astro');
const designSystemPath = path.resolve(process.cwd(), 'DESIGN_SYSTEM.md');

const layoutContent = fs.readFileSync(layoutPath, 'utf8');
const breadcrumbsContent = fs.readFileSync(breadcrumbsPath, 'utf8');
const faqContent = fs.readFileSync(faqPath, 'utf8');
const slugSample = fs.readFileSync(slugPagePath, 'utf8').slice(0, 15000); // Sample first 15k chars
const designSystemSample = fs.readFileSync(designSystemPath, 'utf8').slice(0, 8000);

// Extract Schema definitions from Layout.astro
const schemaStartIndex = layoutContent.indexOf('const localBusinessReviews =');
const schemaEndIndex = layoutContent.indexOf('const unifiedSchemaGraph =');
const schemaSnippet = layoutContent.slice(schemaStartIndex, schemaEndIndex + 150);

// 3. Construct Gemini 4 Argon Audit Prompt
const prompt = `
You are Google's Gemini 4 Argon flagship reasoning model, acting as a Principal Solutions Architect, SEO/AEO Specialist, and Google Material Design 3 (M3) UI/UX Lead for Kalidass Travels (Chennai).

We are auditing the website codebase to eliminate clumsy AI mistakes, fix structured data schema errors, resolve pricing logic contradictions, optimize for Google SERP / AI Overviews (AEO), and enforce strict Google Material Design 3 standards.

### VERIFIED OFFICIAL KALIDASS TRAVELS RATE CARD:
1. Tirupati Packages:
   - 1-Day: Sedan ₹6,000 | Ertiga ₹7,500 | Innova ₹8,500 | Crysta ₹10,000 | Tempo ₹12,500
   - 2-Day: Sedan ₹9,500 | Ertiga ₹11,500 | Innova ₹12,500 | Crysta ₹16,000 | Tempo ₹19,500
   - 3-Day: Sedan ₹13,200 | Ertiga ₹15,800 | Innova ₹17,500 | Crysta ₹22,500 | Tempo ₹27,000
2. Chidambaram & Pichavaram: 1-Day Sedan ₹7,400 | Ertiga ₹9,200 | Innova ₹11,000. 2-Day Sedan ₹9,800 | Ertiga ₹12,000
3. Thiruvannamalai Girivalam: 1-Day Sedan ₹6,500 | Ertiga ₹7,900 | Innova ₹9,300. 2-Day Sedan ₹8,900 | Ertiga ₹10,900
4. Kanchipuram: 1-Day Sedan ₹3,800 | Ertiga ₹4,800 | Innova ₹5,800
5. Kumbakonam Navagraha (9 Temples): 2-Day Sedan ₹14,500 | Ertiga ₹18,500 | Innova ₹22,500. 3-Day Sedan ₹19,500 | Ertiga ₹24,500
6. Rameswaram & Dhanushkodi: 2-Day Sedan ₹18,500 | Ertiga ₹23,500 | Innova ₹27,500. 3-Day Sedan ₹24,500 | Ertiga ₹30,500
7. Sabarimala: 3-Day Sedan ₹24,000 | Ertiga ₹30,000 | Innova ₹36,000. 4-Day Sedan ₹29,500 | Ertiga ₹36,500 | Innova ₹43,500
8. Chennai Airport Transfers: City hubs from ₹450-₹850 (AC Sedan). Outstation corridors: Pondy ₹2,820, Vellore ₹2,600, Tirupati ₹2,560.
9. Acting Drivers: City 4hr ₹500, 8hr ₹800. Outstation round trip ₹1,400/day.

---

### CODE CONTEXT UNDER AUDIT:

#### 1. Layout.astro Schema & Meta definitions:
\`\`\`javascript
${schemaSnippet}
\`\`\`

#### 2. Breadcrumbs.astro Schema:
\`\`\`astro
${breadcrumbsContent}
\`\`\`

#### 3. FAQ.astro Schema:
\`\`\`astro
${faqContent}
\`\`\`

#### 4. [slug].astro Service Page Snippet (Logic & Calculations):
\`\`\`astro
${slugSample.slice(0, 4000)}
\`\`\`

#### 5. M3 Design System Reference:
\`\`\`markdown
${designSystemSample.slice(0, 3000)}
\`\`\`

---

### AUDIT INSTRUCTIONS:
Perform a deep, rigorous, multi-point audit with exact code corrections:

1. **CRITICAL SCHEMA & TARIFF LOGIC CONFLICTS:**
   - Identify every pricing discrepancy in the \`OfferCatalog\` in Layout.astro vs the verified rate card (e.g. Navagraha, Sabarimala, Rameswaram, etc.).
   - Explain the risk of Google Merchant / Search algorithmic penalties for mismatched pricing.
   - Provide the exact corrected \`hasOfferCatalog\` array.

2. **JSON-LD @GRAPH ARCHITECTURE & BROKEN NODES:**
   - Analyze how Breadcrumbs and FAQ create separate isolated \`<script type="application/ld+json">\` blocks with conflicting or hardcoded \`isPartOf: "https://kalidasstravels.in/#webpage"\`.
   - Show how to connect Breadcrumbs and FAQ into the unified @graph in Layout.astro, or make them dynamically use current page URL.
   - Audit the synthetic review dates (\`datePublished: 2024-0\${(idx % 9) + 1}-01\`) and provide the safe, Google-compliant fix.

3. **SERP, SNIPPET & AEO (ANSWER ENGINE OPTIMIZATION):**
   - Provide concrete best practices for winning Featured Snippets and Google AI Overviews (SGE / Perplexity) for taxi and temple tours.
   - Specify the exact 45-50 word Direct Answer format needed on service pages.

4. **GOOGLE MATERIAL DESIGN 3 (M3) UI/UX COMPLIANCE:**
   - Audit the UI against Google M3 standards: Tonal containers, Surface elevation (0 to 5), shape scales (pill rounded-full for buttons/chips), and states.
   - Explain why building native Astro/Tailwind M3 components is superior to loading heavy client-side @material/web web components for Core Web Vitals (LCP, INP) and SEO.
   - Provide code templates for an authentic M3 Button, M3 Filter Chip, and M3 Surface Container Card.

Format your response in structured Markdown with clear headings and ready-to-implement code blocks.
`;

async function runAudit() {
  try {
    console.log('📡 Sending codebase to Gemini 4 Argon for deep reasoning audit...\n');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-4-argon:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('No candidate response returned from Gemini 4 Argon');
    }

    const docsDir = path.resolve(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

    const reportPath = path.join(docsDir, 'GEMINI_4_ARGON_AUDIT_REPORT.md');
    fs.writeFileSync(reportPath, resultText, 'utf8');

    console.log('✅ Gemini 4 Argon Deep Reasoning Audit Completed!');
    console.log(`📄 Full Report Saved to: docs/GEMINI_4_ARGON_AUDIT_REPORT.md\n`);
    console.log('--- SUMMARY PREVIEW ---');
    console.log(resultText.slice(0, 1500) + '...\n');
  } catch (err) {
    console.error('❌ Audit execution failed:', err);
    process.exit(1);
  }
}

runAudit();
