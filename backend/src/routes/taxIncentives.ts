import express, { Request, Response } from 'express';
import pool from '../db';

const router = express.Router();

/**
 * GET /api/tax-incentives
 * Get all tax incentives
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        state,
        country,
        incentive_min_percent,
        incentive_max_percent,
        incentive_type,
        incentive_mechanism,
        minimum_spend,
        project_cap,
        annual_cap
      FROM tax_incentives
      ORDER BY state
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching tax incentives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax incentives'
    });
  }
});

/**
 * GET /api/tax-incentives/:state
 * Get detailed tax incentive information for a specific state
 */
router.get('/:state', async (req: Request, res: Response) => {
  try {
    const { state } = req.params;

    const result = await pool.query(`
      SELECT *
      FROM tax_incentives
      WHERE LOWER(state) = LOWER($1)
    `, [state]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No tax incentive found for state: ${state}`
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching tax incentive:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax incentive'
    });
  }
});

/**
 * POST /api/tax-incentives/calculate
 * Calculate estimated tax incentive for a production
 *
 * Request body:
 * {
 *   state: string,
 *   totalBudget: number,
 *   residentAtlSpend: number,
 *   residentBtlSpend: number,
 *   nonResidentAtlSpend: number,
 *   nonResidentBtlSpend: number,
 *   qualifiedSpend: number,
 *   hasVfx?: boolean,
 *   vfxSpend?: number,
 *   hasLocalHire?: boolean,
 *   isVeteranOwned?: boolean
 * }
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const {
      state,
      totalBudget,
      residentAtlSpend = 0,
      residentBtlSpend = 0,
      nonResidentAtlSpend = 0,
      nonResidentBtlSpend = 0,
      qualifiedSpend,
      hasVfx = false,
      vfxSpend = 0,
      hasLocalHire = false,
      isVeteranOwned = false
    } = req.body;

    // Get state tax incentive details
    const incentiveResult = await pool.query(`
      SELECT *
      FROM tax_incentives
      WHERE LOWER(state) = LOWER($1)
    `, [state]);

    if (incentiveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No tax incentive found for state: ${state}`
      });
    }

    const incentive = incentiveResult.rows[0];

    // Check minimum spend requirement
    if (incentive.minimum_spend && totalBudget < incentive.minimum_spend) {
      return res.json({
        success: true,
        eligible: false,
        reason: `Budget ($${totalBudget.toLocaleString()}) is below minimum spend requirement ($${incentive.minimum_spend.toLocaleString()})`,
        minimumSpend: incentive.minimum_spend
      });
    }

    // Calculate base credit from labor
    let laborCredit = 0;
    if (incentive.resident_atl_percent) {
      laborCredit += residentAtlSpend * (incentive.resident_atl_percent / 100);
    }
    if (incentive.resident_btl_percent) {
      laborCredit += residentBtlSpend * (incentive.resident_btl_percent / 100);
    }
    if (incentive.non_resident_atl_percent) {
      laborCredit += nonResidentAtlSpend * (incentive.non_resident_atl_percent / 100);
    }
    if (incentive.non_resident_btl_percent) {
      laborCredit += nonResidentBtlSpend * (incentive.non_resident_btl_percent / 100);
    }

    // Calculate credit from qualified spend
    let spendCredit = 0;
    if (incentive.qualified_spend_percent && qualifiedSpend) {
      spendCredit = qualifiedSpend * (incentive.qualified_spend_percent / 100);
    }

    // Calculate base credit
    let baseCredit = laborCredit + spendCredit;

    // Apply project cap if exists
    if (incentive.project_cap && baseCredit > incentive.project_cap) {
      baseCredit = incentive.project_cap;
    }

    // Calculate uplifts (simplified - would need more complex logic for real implementation)
    const uplifts: Array<{ type: string; amount: number; description: string }> = [];
    let totalUplifts = 0;

    // Note: Actual uplift calculation would need to parse the uplift text fields
    // This is a simplified version

    const finalCredit = baseCredit + totalUplifts;
    const effectiveCreditRate = totalBudget > 0 ? (finalCredit / totalBudget) * 100 : 0;

    res.json({
      success: true,
      eligible: true,
      calculation: {
        state: incentive.state,
        totalBudget,
        laborCredit,
        spendCredit,
        baseCredit,
        uplifts,
        totalUplifts,
        finalCredit,
        effectiveCreditRate: effectiveCreditRate.toFixed(2),
        incentiveType: incentive.incentive_type,
        mechanism: incentive.incentive_mechanism
      },
      details: {
        minimumSpend: incentive.minimum_spend,
        projectCap: incentive.project_cap,
        annualCap: incentive.annual_cap,
        compensationCap: incentive.compensation_cap
      }
    });
  } catch (error) {
    console.error('Error calculating tax incentive:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate tax incentive'
    });
  }
});

/**
 * POST /api/tax-incentives/compare
 * Compare tax incentives across multiple states
 *
 * Request body:
 * {
 *   states: string[],
 *   totalBudget: number,
 *   residentAtlSpend: number,
 *   residentBtlSpend: number,
 *   nonResidentAtlSpend: number,
 *   nonResidentBtlSpend: number,
 *   qualifiedSpend: number
 * }
 */
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const {
      states,
      totalBudget,
      residentAtlSpend = 0,
      residentBtlSpend = 0,
      nonResidentAtlSpend = 0,
      nonResidentBtlSpend = 0,
      qualifiedSpend
    } = req.body;

    if (!Array.isArray(states) || states.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'States array is required'
      });
    }

    const comparisons = [];

    for (const state of states) {
      // Get state tax incentive details
      const incentiveResult = await pool.query(`
        SELECT *
        FROM tax_incentives
        WHERE LOWER(state) = LOWER($1)
      `, [state]);

      if (incentiveResult.rows.length === 0) {
        comparisons.push({
          state,
          eligible: false,
          reason: 'No tax incentive program found'
        });
        continue;
      }

      const incentive = incentiveResult.rows[0];

      // Check minimum spend
      if (incentive.minimum_spend && totalBudget < incentive.minimum_spend) {
        comparisons.push({
          state: incentive.state,
          eligible: false,
          reason: `Below minimum spend ($${incentive.minimum_spend.toLocaleString()})`,
          minimumSpend: incentive.minimum_spend
        });
        continue;
      }

      // Calculate credit
      let laborCredit = 0;
      if (incentive.resident_atl_percent) {
        laborCredit += residentAtlSpend * (incentive.resident_atl_percent / 100);
      }
      if (incentive.resident_btl_percent) {
        laborCredit += residentBtlSpend * (incentive.resident_btl_percent / 100);
      }
      if (incentive.non_resident_atl_percent) {
        laborCredit += nonResidentAtlSpend * (incentive.non_resident_atl_percent / 100);
      }
      if (incentive.non_resident_btl_percent) {
        laborCredit += nonResidentBtlSpend * (incentive.non_resident_btl_percent / 100);
      }

      let spendCredit = 0;
      if (incentive.qualified_spend_percent && qualifiedSpend) {
        spendCredit = qualifiedSpend * (incentive.qualified_spend_percent / 100);
      }

      let totalCredit = laborCredit + spendCredit;

      // Apply project cap
      if (incentive.project_cap && totalCredit > incentive.project_cap) {
        totalCredit = incentive.project_cap;
      }

      const effectiveRate = totalBudget > 0 ? (totalCredit / totalBudget) * 100 : 0;

      comparisons.push({
        state: incentive.state,
        eligible: true,
        totalCredit,
        effectiveRate: effectiveRate.toFixed(2),
        incentiveType: incentive.incentive_type,
        mechanism: incentive.incentive_mechanism,
        minPercent: incentive.incentive_min_percent,
        maxPercent: incentive.incentive_max_percent,
        projectCap: incentive.project_cap,
        annualCap: incentive.annual_cap
      });
    }

    // Sort by total credit (highest first)
    comparisons.sort((a, b) => {
      if (!a.eligible) return 1;
      if (!b.eligible) return -1;
      return (b.totalCredit || 0) - (a.totalCredit || 0);
    });

    res.json({
      success: true,
      data: comparisons,
      summary: {
        totalStatesCompared: states.length,
        eligibleStates: comparisons.filter(c => c.eligible).length,
        bestState: comparisons.find(c => c.eligible)?.state || null,
        bestCredit: comparisons.find(c => c.eligible)?.totalCredit || 0
      }
    });
  } catch (error) {
    console.error('Error comparing tax incentives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare tax incentives'
    });
  }
});

export default router;
