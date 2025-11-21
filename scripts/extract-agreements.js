const fs = require('fs');
const path = require('path');
const pdfExtract = require('pdf-text-extract');
const { promisify } = require('util');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const extractPDFText = promisify(pdfExtract);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const AGREEMENTS_DIR = path.join(process.env.HOME, 'Documents/budgets/Guild Agreements');
const OUTPUT_DIR = path.join(__dirname, '../database/guild_agreements');
const questions = [];
const summary = [];

// Parse union name from filename
function parseUnionName(filename) {
  const lower = filename.toLowerCase();

  if (lower.includes('dga') || lower.includes('directors guild')) {
    return 'DGA';
  } else if (lower.includes('wga') || lower.includes('writers guild')) {
    return 'WGA';
  } else if (lower.includes('sag-aftra') || lower.includes('screen actors')) {
    return 'SAG-AFTRA';
  } else if (lower.match(/local[- ](\d+)/i)) {
    const match = lower.match(/local[- ](\d+)/i);
    return `IATSE Local ${match[1]}`;
  } else if (lower.includes('iatse')) {
    return 'IATSE';
  } else if (lower.includes('casting')) {
    return 'Teamsters Local 399/IATSE Local 817';
  } else if (lower.includes('dgc')) {
    return 'DGC';
  } else if (lower.includes('epc')) {
    return 'EPC';
  } else {
    return 'Unknown Union';
  }
}

// Extract text from PDF
async function extractPDF(filePath) {
  try {
    const pages = await extractPDFText(filePath);
    return pages.join('\n');
  } catch (error) {
    throw new Error(`Failed to extract PDF: ${error.message}`);
  }
}

// Use OpenAI to extract structured rate data
async function extractRateData(pdfText, filename, unionName) {
  // Truncate PDF text if too long (GPT-4o-mini has 128k context)
  const maxChars = 400000; // ~100k tokens
  const truncatedText = pdfText.length > maxChars
    ? pdfText.substring(0, maxChars) + '\n\n[TRUNCATED - PDF TOO LONG]'
    : pdfText;

  const prompt = `You are analyzing a guild/union collective bargaining agreement for the film/TV industry.

**PDF Filename:** ${filename}
**Union:** ${unionName}

**Your Task:**
Extract structured rate and rule data from this CBA. Focus on:
1. Agreement name and dates (effective date, expiration date)
2. Rate cards: job positions, minimum rates, rate types (daily/weekly), locations, production types
3. Sideletter rules: special rates for specific production types (multi-camera, single-camera, SVOD, etc.)
4. Fringe benefits: pension, health, vacation/holiday rates, payroll taxes
5. Special provisions: meal penalties, overtime rules, turnaround time, etc.

**Return a JSON object with this structure:**
{
  "agreementName": "string",
  "effectiveDate": "YYYY-MM-DD or null",
  "expirationDate": "YYYY-MM-DD or null",
  "rateCards": [
    {
      "jobClassification": "string",
      "baseRate": "number as string",
      "rateType": "daily|weekly|hourly",
      "location": "string or null",
      "productionType": "theatrical|network_tv|hb_svod|etc or null",
      "notes": "string or null"
    }
  ],
  "sideletterRules": [
    {
      "ruleName": "string",
      "productionType": "string",
      "distributionPlatform": "string or null",
      "rateAdjustmentDescription": "string",
      "notes": "string or null"
    }
  ],
  "fringeBenefits": [
    {
      "benefitType": "pension|health|vacation_holiday|payroll_tax",
      "rate": "string (percentage or flat amount)",
      "description": "string"
    }
  ],
  "questions": [
    {
      "question": "string - what is unclear or ambiguous",
      "context": "string - where in the document",
      "assumptionMade": "string - what you assumed for now",
      "confidence": "HIGH|MEDIUM|LOW"
    }
  ],
  "overallConfidence": "HIGH|MEDIUM|LOW",
  "summary": "string - brief summary of what was extracted"
}

**Important:**
- If you can't find specific information, use null values
- Log ALL uncertainties in the questions array
- Be conservative with confidence ratings
- Focus on accuracy over completeness

**PDF Content:**
${truncatedText}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting structured rate data from union collective bargaining agreements. You understand film/TV production budgeting, union rules, and industry terminology. Return valid JSON only.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 16000
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error(`OpenAI extraction failed: ${error.message}`);
  }
}

// Generate SQL INSERT statements
function generateSQL(rateData, unionName, filename) {
  const sqlParts = [];
  const timestamp = new Date().toISOString().split('T')[0];

  sqlParts.push(`-- Guild Agreement: ${filename}`);
  sqlParts.push(`-- Union: ${unionName}`);
  sqlParts.push(`-- Agreement: ${rateData.agreementName || 'Unknown'}`);
  sqlParts.push(`-- Extracted: ${timestamp}`);
  sqlParts.push(`-- Confidence: ${rateData.overallConfidence || 'UNKNOWN'}`);
  sqlParts.push('');

  // Insert union agreement record
  const agreementId = `'${filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}'`;
  const agreementName = (rateData.agreementName || filename).substring(0, 100); // Truncate to 100 chars
  sqlParts.push(`-- Insert union agreement`);
  sqlParts.push(`INSERT INTO union_agreements (id, union_name, agreement_type, effective_date_start, effective_date_end, document_url)`);
  sqlParts.push(`VALUES (`);
  sqlParts.push(`  gen_random_uuid(),`);
  sqlParts.push(`  '${unionName.substring(0, 100).replace(/'/g, "''")}',`); // Truncate union_name too
  sqlParts.push(`  '${agreementName.replace(/'/g, "''")}',`);
  sqlParts.push(`  ${rateData.effectiveDate ? `'${rateData.effectiveDate}'` : 'NULL'},`);
  sqlParts.push(`  ${rateData.expirationDate ? `'${rateData.expirationDate}'` : 'NULL'},`);
  sqlParts.push(`  '${path.join(AGREEMENTS_DIR, filename).replace(/'/g, "''")}'`);
  sqlParts.push(`);`);
  sqlParts.push('');

  // Insert rate cards
  if (rateData.rateCards && rateData.rateCards.length > 0) {
    sqlParts.push(`-- Rate Cards (${rateData.rateCards.length} positions)`);
    for (const rate of rateData.rateCards) {
      // Skip if required fields are null
      if (!rate.jobClassification || !rate.rateType || !rate.baseRate) continue;

      // Validate base_rate is numeric
      const baseRateStr = String(rate.baseRate).trim();
      const baseRateNum = parseFloat(baseRateStr.replace(/[^0-9.]/g, ''));
      if (isNaN(baseRateNum) || baseRateNum <= 0) continue;

      sqlParts.push(`INSERT INTO rate_cards (union_local, job_classification, rate_type, base_rate, location, production_type, effective_date)`);
      sqlParts.push(`VALUES (`);
      sqlParts.push(`  '${unionName.replace(/'/g, "''")}',`);
      sqlParts.push(`  '${rate.jobClassification.replace(/'/g, "''")}',`);
      sqlParts.push(`  '${rate.rateType}',`);
      sqlParts.push(`  ${baseRateNum},`);
      sqlParts.push(`  ${rate.location ? `'${rate.location.replace(/'/g, "''")}'` : 'NULL'},`);
      sqlParts.push(`  ${rate.productionType ? `'${rate.productionType}'` : 'NULL'},`);
      sqlParts.push(`  ${rateData.effectiveDate ? `'${rateData.effectiveDate}'` : 'CURRENT_DATE'}`);
      sqlParts.push(`) ON CONFLICT (union_local, job_classification, location, production_type, effective_date) DO NOTHING;`);
    }
    sqlParts.push('');
  }

  // Insert sideletter rules
  if (rateData.sideletterRules && rateData.sideletterRules.length > 0) {
    sqlParts.push(`-- Sideletter Rules (${rateData.sideletterRules.length} rules)`);
    for (const rule of rateData.sideletterRules) {
      // Skip if required fields are null
      if (!rule.ruleName) continue;

      sqlParts.push(`INSERT INTO sideletter_rules (sideletter_name, production_type, distribution_platform)`);
      sqlParts.push(`VALUES (`);
      sqlParts.push(`  '${rule.ruleName.replace(/'/g, "''")}',`);
      sqlParts.push(`  ${rule.productionType ? `'${rule.productionType.replace(/'/g, "''")}'` : 'NULL'},`);
      sqlParts.push(`  ${rule.distributionPlatform ? `'${rule.distributionPlatform.replace(/'/g, "''")}'` : 'NULL'}`);
      sqlParts.push(`);`);
    }
    sqlParts.push('');
  }

  // Insert fringe benefits
  if (rateData.fringeBenefits && rateData.fringeBenefits.length > 0) {
    sqlParts.push(`-- Fringe Benefits (${rateData.fringeBenefits.length} benefits)`);
    for (const fringe of rateData.fringeBenefits) {
      // Skip if required fields are null
      if (!fringe.benefitType || !fringe.rate) continue;

      // Validate rate_value is numeric
      const rateStr = String(fringe.rate).trim();
      const rateNum = parseFloat(rateStr.replace(/[^0-9.]/g, ''));
      if (isNaN(rateNum) || rateNum < 0) continue;

      sqlParts.push(`INSERT INTO fringe_benefits (benefit_type, union_local, state, rate_type, rate_value, effective_date)`);
      sqlParts.push(`VALUES (`);
      sqlParts.push(`  '${fringe.benefitType}',`);
      sqlParts.push(`  '${unionName.replace(/'/g, "''")}',`);
      sqlParts.push(`  'CA',`); // Default to CA, can be updated later
      sqlParts.push(`  'percentage',`);
      sqlParts.push(`  ${rateNum},`);
      sqlParts.push(`  ${rateData.effectiveDate ? `'${rateData.effectiveDate}'` : 'CURRENT_DATE'}`);
      sqlParts.push(`);`);
    }
    sqlParts.push('');
  }

  return sqlParts.join('\n');
}

// Write questions log
function writeQuestionsLog() {
  const lines = [];
  lines.push('# Guild Agreement Extraction - Questions for Expert Review');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Total Agreements Processed:** ${summary.length}`);
  lines.push(`**Total Questions:** ${questions.reduce((sum, q) => sum + q.questions.length, 0)}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const item of questions) {
    if (item.questions.length === 0) continue;

    lines.push(`## ${item.file}`);
    lines.push('');

    item.questions.forEach((q, idx) => {
      lines.push(`### QUESTION ${idx + 1}: ${q.question}`);
      lines.push(`- **Context:** ${q.context}`);
      lines.push(`- **Assumption Made:** ${q.assumptionMade}`);
      lines.push(`- **Confidence:** ${q.confidence}`);
      lines.push('');
    });

    lines.push('---');
    lines.push('');
  }

  fs.writeFileSync(
    path.join(__dirname, '../database/extraction_questions.md'),
    lines.join('\n')
  );
}

// Write summary
function writeSummary() {
  const lines = [];
  lines.push('# Guild Agreement Extraction Summary');
  lines.push('');
  lines.push(`**Extraction Date:** ${new Date().toISOString()}`);
  lines.push(`**Total Files Processed:** ${summary.length}`);
  lines.push('');

  const successful = summary.filter(s => !s.error);
  const failed = summary.filter(s => s.error);

  lines.push(`**Successful:** ${successful.length}`);
  lines.push(`**Failed:** ${failed.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## Successful Extractions');
  lines.push('');
  lines.push('| File | Union | Agreement | Rate Cards | Confidence |');
  lines.push('|------|-------|-----------|------------|------------|');

  for (const item of successful) {
    lines.push(`| ${item.file} | ${item.unionName} | ${item.agreementName || 'N/A'} | ${item.rateCardsExtracted || 0} | ${item.confidence || 'N/A'} |`);
  }

  lines.push('');

  if (failed.length > 0) {
    lines.push('## Failed Extractions');
    lines.push('');
    for (const item of failed) {
      lines.push(`- **${item.file}**: ${item.error}`);
    }
    lines.push('');
  }

  fs.writeFileSync(
    path.join(__dirname, '../database/extraction_summary.md'),
    lines.join('\n')
  );
}

// Main execution
async function main() {
  console.log('🚀 Guild Agreement Extraction Starting...\n');

  // Verify API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }

  // Verify agreements directory exists
  if (!fs.existsSync(AGREEMENTS_DIR)) {
    console.error(`❌ Agreements directory not found: ${AGREEMENTS_DIR}`);
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get all PDF files (excluding subdirectories and hidden files)
  const files = fs.readdirSync(AGREEMENTS_DIR)
    .filter(f => f.endsWith('.pdf'))
    .filter(f => !f.startsWith('.'));

  console.log(`📁 Found ${files.length} PDF files to process\n`);

  let processed = 0;

  for (const file of files) {
    processed++;
    console.log(`[${processed}/${files.length}] Processing: ${file}`);

    try {
      const filePath = path.join(AGREEMENTS_DIR, file);
      const unionName = parseUnionName(file);

      console.log(`  📋 Union: ${unionName}`);
      console.log(`  📄 Extracting PDF text...`);

      const pdfText = await extractPDF(filePath);
      console.log(`  ✓ Extracted ${pdfText.length} characters`);

      console.log(`  🤖 Analyzing with AI...`);
      const rateData = await extractRateData(pdfText, file, unionName);

      console.log(`  ✓ Extracted:`);
      console.log(`    - Rate Cards: ${rateData.rateCards?.length || 0}`);
      console.log(`    - Sideletter Rules: ${rateData.sideletterRules?.length || 0}`);
      console.log(`    - Fringe Benefits: ${rateData.fringeBenefits?.length || 0}`);
      console.log(`    - Questions: ${rateData.questions?.length || 0}`);
      console.log(`    - Confidence: ${rateData.overallConfidence}`);

      const sql = generateSQL(rateData, unionName, file);
      const sqlFileName = file.replace('.pdf', '.sql').replace(/ /g, '_');
      fs.writeFileSync(path.join(OUTPUT_DIR, sqlFileName), sql);

      console.log(`  💾 SQL saved: ${sqlFileName}`);

      if (rateData.questions && rateData.questions.length > 0) {
        questions.push({ file, questions: rateData.questions });
      }

      summary.push({
        file,
        unionName,
        agreementName: rateData.agreementName,
        rateCardsExtracted: rateData.rateCards?.length || 0,
        confidence: rateData.overallConfidence
      });

      console.log(`  ✅ Completed\n`);

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      summary.push({
        file,
        error: error.message
      });
    }
  }

  console.log('📝 Writing summary and questions log...');
  writeQuestionsLog();
  writeSummary();

  console.log('\n✅ Extraction Complete!\n');
  console.log(`📂 Output Locations:`);
  console.log(`   - SQL Files: ${OUTPUT_DIR}`);
  console.log(`   - Questions Log: database/extraction_questions.md`);
  console.log(`   - Summary: database/extraction_summary.md`);
  console.log('');
  console.log(`📊 Results:`);
  console.log(`   - Processed: ${summary.length} agreements`);
  console.log(`   - Successful: ${summary.filter(s => !s.error).length}`);
  console.log(`   - Failed: ${summary.filter(s => s.error).length}`);
  console.log(`   - Questions Logged: ${questions.reduce((sum, q) => sum + q.questions.length, 0)}`);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Review extraction_questions.md');
  console.log('   2. Send questions to budgeting expert');
  console.log('   3. Update SQL files based on expert feedback');
  console.log('   4. Load SQL files into Railway database');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
