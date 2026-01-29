#!/usr/bin/env node
/**
 * Import WIREMAN Budget Template into ai-budget-system database
 *
 * This script reads the WIREMAN JSON template and inserts it as a budget template
 * that can be used for reference and comparison in the AI budget system.
 *
 * Usage:
 *   DATABASE_URL=<your-db-url> node import_wireman_budget.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

async function importWiremanBudget() {
  const client = await pool.connect();

  try {
    // Read the JSON template
    const templatePath = path.join(__dirname, '2024_Theatrical_WIREMAN_GA_v01.json');
    const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

    console.log('Importing WIREMAN budget template...');
    console.log(`Project: ${templateData.metadata.project_name}`);
    console.log(`Total Budget: $${templateData.metadata.total_budget.toLocaleString()}`);
    console.log(`Departments: ${templateData.departments.length}`);

    await client.query('BEGIN');

    // Check if budget_templates table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'budget_templates'
      );
    `);

    // Check if this template already exists
    const existingCheck = await client.query(`
      SELECT id FROM budget_templates WHERE name = $1
    `, [templateData.metadata.project_name]);

    // Count departments and line items
    let lineItemCount = 0;
    for (const dept of templateData.departments) {
      lineItemCount += dept.line_items ? dept.line_items.length : 0;
    }

    if (existingCheck.rows.length > 0) {
      // Update existing template
      console.log('Updating existing WIREMAN template...');
      await client.query(`
        UPDATE budget_templates SET
          source_filename = $1,
          location = $2,
          production_type = $3,
          shoot_days = $4,
          total_budget = $5,
          atl_total = $6,
          btl_total = $7,
          template_data = $8,
          department_count = $9,
          line_item_count = $10,
          completeness_score = 95.0,
          updated_at = CURRENT_TIMESTAMP
        WHERE name = $11
      `, [
        templateData.metadata.filename,
        templateData.metadata.location,
        templateData.metadata.production_type,
        templateData.metadata.shoot_days,
        templateData.metadata.total_budget,
        templateData.metadata.atl_total,
        templateData.metadata.btl_total,
        JSON.stringify(templateData),
        templateData.departments.length,
        lineItemCount,
        templateData.metadata.project_name
      ]);
    } else {
      // Insert new template
      console.log('Inserting new WIREMAN template...');
      await client.query(`
        INSERT INTO budget_templates (
          name, source_filename, location, production_type, shoot_days,
          total_budget, atl_total, btl_total,
          template_data, department_count, line_item_count, completeness_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        templateData.metadata.project_name,
        templateData.metadata.filename,
        templateData.metadata.location,
        templateData.metadata.production_type,
        templateData.metadata.shoot_days,
        templateData.metadata.total_budget,
        templateData.metadata.atl_total,
        templateData.metadata.btl_total,
        JSON.stringify(templateData),
        templateData.departments.length,
        lineItemCount,
        95.0  // High completeness score - comprehensive budget
      ]);
    }

    await client.query('COMMIT');

    console.log('\n✓ WIREMAN budget template imported successfully!');
    console.log('\nBudget Summary:');
    console.log(`  Above-The-Line: $${templateData.metadata.atl_total.toLocaleString()}`);
    console.log(`  Below-The-Line: $${templateData.metadata.btl_total.toLocaleString()}`);
    console.log(`  Grand Total:    $${templateData.metadata.total_budget.toLocaleString()}`);
    console.log(`  GA Tax Rebate:  -$${templateData.metadata.georgia_tax_rebate.toLocaleString()}`);
    console.log(`  CHI Tax Rebate: -$${templateData.metadata.chicago_tax_rebate.toLocaleString()}`);
    console.log(`  Net Total:      $${templateData.metadata.net_total.toLocaleString()}`);

    // Print department totals
    console.log('\nDepartment Totals:');
    let runningTotal = 0;
    for (const dept of templateData.departments) {
      console.log(`  ${dept.account} ${dept.name.padEnd(30)} $${dept.total.toLocaleString().padStart(12)}`);
      runningTotal += dept.total;
    }
    console.log(`  ${''.padEnd(34)} ${'─'.repeat(12)}`);
    console.log(`  ${'CALCULATED TOTAL'.padEnd(34)} $${runningTotal.toLocaleString().padStart(12)}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error importing budget:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importWiremanBudget().catch(console.error);
