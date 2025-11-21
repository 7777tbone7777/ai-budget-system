# Movie Magic Budgeting 7 - Analysis for AI Budget System

**Source**: 167-page MMB User Manual (analyzed pages 1-50)
**Purpose**: Inform AI Budget System development with industry-standard features

---

## Executive Summary

Movie Magic Budgeting (MMB) is the industry-standard budgeting software for film/TV production. This analysis extracts critical features, data structures, and workflows to inform our AI Budget System development.

**Key Takeaway**: MMB uses a 4-level hierarchical structure with sophisticated fringe calculation, multi-currency support, and reusable components (Globals, Groups, Shortcuts).

---

## 1. Core Budget Hierarchy

MMB uses a **4-level structure**:

### Level 1: Topsheet (Categories)
- Broad groupings of budget items
- Examples: "Development", "Story & Other Rights", "Producers Unit", "Directors Unit"
- Shows high-level totals with optional variance tracking
- Supports **Level Breaks** (production totals like "Above-the-Line", "Below-the-Line")
- **Contractual Charges** applied here (producer fees, overhead percentages)
- **Applied Credits** (tax incentives) reduce totals

### Level 2: Accounts
- Specific accounts within categories
- Example: Category 1100 "Development" contains accounts like:
  - 1100 - Story & Other Rights
  - 1200 - Continuity & Treatment
  - 1300 - Producers Unit
- Account numbering: Category-Account (e.g., 11-00, 12-00)
- Configurable width (1-6 digits each)
- Optional separator: None, Space, or Hyphen

### Level 3: Details (Line Items)
- Individual budget line items with full detail
- **Critical columns**:
  - Description
  - Amount (quantity)
  - Units (D=Day, W=Week, H=Hour, M=Month, etc.)
  - X (multiplier)
  - Rate
  - Subtotal
  - **Aggregate Fringe %** (AGG)
  - **Applied Fringes** (FRIN)
  - **Groups** (GRP)
  - **Location** (LOC)
  - **Set** (SET)
  - **Currency** (CUR)

### Level 4: 4th Level (Hidden Spreadsheet)
- Excel-like spreadsheet for detailed calculations
- Can link cells to Details Level
- Useful for complex calculations that feed into line items

---

## 2. Critical Features to Implement

### 2.1 Fringes (Payroll Taxes & Benefits)

**Two Types**:
1. **Percentage Fringes**: Applied as % of gross wages
   - Example: 15% Payroll Taxes, 22% Health & Welfare
2. **Flat Rate Fringes**: Fixed amount per unit
   - Example: $50/day for meals, $100/week for kit rental

**Fringe Posting Options**:
- **Budget**: All fringes in single topsheet total
- **Production Level**: Fringes grouped by Above/Below-the-Line
- **Category**: Separate fringe account per category (e.g., 1199 for category 1100)
- **Account**: Fringes posted to end of each account

**Aggregate Fringe Calculation**:
- **Method 1** (default): `Total Fringes / Line Total`
- **Method 2**: Sum of all percentage fringes (excludes flat rates)

**Fringe Ranges**: Apply different fringes to specific line ranges
- Example: Lines 1-50 use LA fringes, lines 51-100 use NY fringes

**Database Impact**:
```sql
-- New tables needed
CREATE TABLE fringes (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(20), -- 'percentage' or 'flat_rate'
  rate DECIMAL(10,5),
  applies_to VARCHAR(50), -- 'all', 'union_only', 'non_union'
  union_local VARCHAR(255),
  state VARCHAR(2),
  effective_date DATE
);

CREATE TABLE fringe_ranges (
  id UUID PRIMARY KEY,
  budget_line_item_id UUID REFERENCES budget_line_items(id),
  start_line INT,
  end_line INT,
  fringe_set VARCHAR(255) -- reference to group of fringes
);
```

### 2.2 Globals (Reusable Variables)

**Purpose**: Store values used across multiple line items
- Examples:
  - `NUM_EPISODES = 10`
  - `SHOOT_DAYS = 45`
  - `LA_DAILY_RATE = 350`

**Global Groups**: Organize globals by category
- Production Globals
- Rate Globals
- Location Globals

**Usage**: Type global name in Amount field, auto-expands

**Database Impact**:
```sql
CREATE TABLE globals (
  id UUID PRIMARY KEY,
  production_id UUID REFERENCES productions(id),
  name VARCHAR(100) UNIQUE,
  value DECIMAL(15,2),
  precision INT, -- decimal places
  description TEXT,
  global_group VARCHAR(100)
);
```

### 2.3 Groups (Budget Categories)

**Purpose**: Organize line items for filtering, reporting, and analysis
- Examples: "Prep", "Shoot", "Wrap", "Post-Production"
- Can include/exclude from totals
- Useful for scenario analysis

**Database Impact**:
```sql
CREATE TABLE budget_groups (
  id UUID PRIMARY KEY,
  production_id UUID REFERENCES productions(id),
  name VARCHAR(100),
  description TEXT,
  include_in_total BOOLEAN DEFAULT true,
  sort_order INT
);

CREATE TABLE budget_line_item_groups (
  line_item_id UUID REFERENCES budget_line_items(id),
  group_id UUID REFERENCES budget_groups(id),
  PRIMARY KEY (line_item_id, group_id)
);
```

### 2.4 Shortcuts (Templates)

**Purpose**: Pre-built line item templates
- Example: "Director - Prep/Shoot/Wrap" template includes:
  - 2 weeks prep @ $5,000/week
  - 8 weeks shoot @ $7,500/week
  - 1 week wrap @ $5,000/week
  - Auto-applies fringes

**Database Impact**:
```sql
CREATE TABLE shortcuts (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  template_data JSONB -- stores full line item structure
);
```

### 2.5 Units System

**Preset Units** (with hour equivalents for fringe calc):
- A = Allow (no hours)
- **D = Day(s) - 12 hrs**
- F = Flat (no hours)
- H = Hour(s) - 1 hr
- **M = Month(s) - 240 hrs**
- T = Foot/Feet (no hours)
- R = Reel(s) (no hours)
- **W = Week(s) - 60 hrs**

**Database**: Already exists in our schema, confirm hour equivalents

### 2.6 Contractual Charges (Producer Fees/Overhead)

**Two Types**:
1. **Percentage**: % of budget total
   - Example: 10% Producer Fee on Above-the-Line
2. **Flat Fee**: Fixed amount
   - Example: $50,000 overhead

**Exclusions**: Specify what to exclude from calculation
- Can exclude specific accounts, line items, or groups

**Database Impact**:
```sql
CREATE TABLE contractual_charges (
  id UUID PRIMARY KEY,
  production_id UUID REFERENCES productions(id),
  name VARCHAR(255),
  charge_type VARCHAR(20), -- 'percentage' or 'flat_fee'
  rate DECIMAL(10,2),
  applies_to VARCHAR(50), -- 'above_line', 'below_line', 'all', 'custom'
  exclusions JSONB -- list of excluded accounts/items
);
```

### 2.7 Applied Credits (Tax Incentives)

**Purpose**: Apply tax credits that reduce budget totals
- Can cap credits at specific amount
- Applied after contractual charges

**Database**: Enhance existing `tax_incentives` table:
```sql
ALTER TABLE tax_incentives ADD COLUMN cap_type VARCHAR(20); -- 'percentage' or 'amount'
ALTER TABLE tax_incentives ADD COLUMN cap_value DECIMAL(15,2);
ALTER TABLE tax_incentives ADD COLUMN qualified_spend_only BOOLEAN DEFAULT true;
```

### 2.8 Multi-Currency Support

**Features**:
- Base currency (default: USD with rate 1.0)
- Multiple currencies per budget
- Auto-conversion to base currency
- Currency symbol position (left/right)
- Custom thousands separator

**Database** (enhance existing):
```sql
CREATE TABLE currencies (
  id UUID PRIMARY KEY,
  code VARCHAR(10) UNIQUE, -- 'USD', 'CAD', 'GBP'
  name VARCHAR(100),
  symbol VARCHAR(10),
  symbol_on_right BOOLEAN DEFAULT false,
  thousands_separator VARCHAR(1) DEFAULT ',',
  exchange_rate DECIMAL(10,5),
  is_base BOOLEAN DEFAULT false
);
```

### 2.9 Locations & Sets

**Locations**: Track costs by filming location
- Name, Description, Auto-calculated Total

**Sets**: Track costs by production set
- Name, Description, Auto-calculated Total

**Database**: Already have basic structure, ensure totals are calculated

### 2.10 Comparison Totals (Variance Tracking)

**Three Columns**:
1. **Original**: Locked baseline budget
2. **Current**: Latest budget amounts
3. **Variance**: Difference (Current - Original)

**Lock Original**: Prevents accidental changes to baseline

**Database Impact**:
```sql
ALTER TABLE budget_line_items ADD COLUMN original_subtotal DECIMAL(15,2);
ALTER TABLE budget_line_items ADD COLUMN original_total DECIMAL(15,2);
ALTER TABLE productions ADD COLUMN lock_original_totals BOOLEAN DEFAULT false;
```

---

## 3. Calculation Engine

### Line Item Calculation
```
Subtotal = Amount × Units × X × Rate
Fringes = Apply all applicable fringes (percentage + flat rate)
Total = Subtotal + Fringes
```

### Account Total
```
Account Total = SUM(all line items in account)
```

### Category Total
```
Category Total = SUM(all accounts in category) + Category Fringes (if applicable)
```

### Budget Total
```
Untitled Total = SUM(all categories)
Above-the-Line Total = SUM(categories before first level break)
Below-the-Line Total = SUM(categories after first level break)
```

### With Contractual Charges & Credits
```
Subtotal = Budget Total
+ Contractual Charges
- Applied Credits
= Grand Total
```

---

## 4. Database Schema Changes Needed

### New Tables to Create

1. **`budget_preferences`**
   ```sql
   CREATE TABLE budget_preferences (
     production_id UUID PRIMARY KEY REFERENCES productions(id),
     fringe_computation_method VARCHAR(50) DEFAULT 'fringe_total_line_total',
     post_fringes_by VARCHAR(50) DEFAULT 'budget',
     fringe_category_account_number VARCHAR(10),
     rate_display_cutoff DECIMAL(10,2) DEFAULT 100.0,
     precision_below_cutoff INT DEFAULT 2,
     precision_above_cutoff INT DEFAULT 3,
     category_width INT DEFAULT 2,
     account_width INT DEFAULT 2,
     subaccount_width INT DEFAULT 0,
     set_width INT DEFAULT 2,
     category_account_separator VARCHAR(10) DEFAULT 'none',
     display_summary_totals BOOLEAN DEFAULT true,
     lock_original_totals BOOLEAN DEFAULT false
   );
   ```

2. **`globals`** (as shown above)

3. **`budget_groups`** (as shown above)

4. **`shortcuts`** (as shown above)

5. **`contractual_charges`** (as shown above)

6. **`fringe_ranges`** (as shown above)

### Tables to Enhance

1. **`budget_line_items`**
   - Add: `original_subtotal`, `original_total`
   - Add: `aggregate_fringe_pct`
   - Add: `applied_fringes` (JSONB array)
   - Add: `groups` (JSONB array)
   - Add: `location_id`, `set_id`
   - Add: `global_reference` (if using global)

2. **`currencies`**
   - Add fields as shown above

3. **`tax_incentives`**
   - Add cap fields as shown above

---

## 5. Critical Workflows

### Workflow 1: Create New Budget
1. Select template or start blank
2. Set budget preferences (fringe method, account format, etc.)
3. Set up tables: Units, Globals, Fringes, Groups, Locations, Sets, Currencies
4. Build Topsheet (create categories)
5. Create Accounts within each category
6. Add Details (line items) with fringes, globals, groups
7. Apply Contractual Charges & Credits
8. Generate reports

### Workflow 2: Apply Fringes
1. Go to Details Level
2. Select line items
3. Open View/Apply Fringes window
4. Select fringes to apply (percentage and/or flat rate)
5. Optionally set fringe range
6. Fringes auto-calculate and display in AGG and FRIN columns

### Workflow 3: Budget Comparison
1. Lock Original Totals (freeze baseline)
2. Make changes to budget
3. View Original, Current, Variance columns
4. Generate Variance Report

### Workflow 4: Apply Tax Credits
1. Go to Topsheet
2. Insert Applied Credit row
3. Select accounts to include in credit calculation
4. Set cap type and amount
5. Credit auto-calculates and reduces grand total

---

## 6. Features We're Missing

### High Priority
✅ **Have**:
- Rate cards by union/location
- Fringe benefits (percentage-based)
- Production setup
- Basic budget structure

❌ **Missing**:
1. **Globals** - Reusable variables across line items
2. **Groups** - Budget item categorization
3. **Shortcuts** - Pre-built line item templates
4. **Contractual Charges** - Producer fees, overhead
5. **Applied Credits** - Tax incentive application
6. **Fringe Ranges** - Apply different fringes to line ranges
7. **Comparison Totals** - Variance tracking (Original vs Current)
8. **4th Level** - Hidden spreadsheet for complex calculations
9. **Multi-currency** - Full currency support
10. **Formula Maker** - Visual formula builder
11. **Library** - Store/retrieve budget components
12. **Budget Comparison Reports** - Compare multiple budget versions
13. **Sub Budgets** - Create partial budgets from main budget

### Medium Priority
- Flat rate fringes (per unit)
- Location-based cost tracking
- Set-based cost tracking
- Customizable captions (field labels)
- Rate precision configuration
- Account format customization

### Lower Priority
- Print setup & templates
- PDF export customization
- Classic MMB file compatibility
- Vista Accounting integration

---

## 7. Immediate Action Items

### Phase 1: Core Enhancements (2-3 weeks)
1. **Create Globals system**
   - Table schema
   - UI for managing globals
   - Formula parser for line items

2. **Implement Contractual Charges**
   - Percentage and flat fee types
   - Exclusion logic
   - Display in topsheet

3. **Add Applied Credits to topsheet**
   - Link to tax_incentives table
   - Cap logic
   - Qualified spend calculation

4. **Enhance Fringes**
   - Add flat rate fringes
   - Implement fringe ranges
   - Aggregate % calculation options

### Phase 2: Organizational Features (2 weeks)
5. **Build Groups system**
   - Group management UI
   - Apply groups to line items
   - Include/exclude logic

6. **Create Shortcuts/Templates**
   - Template builder
   - Template library
   - Quick apply to budget

### Phase 3: Analysis & Reporting (2 weeks)
7. **Variance Tracking**
   - Original totals column
   - Lock mechanism
   - Variance reports

8. **Multi-currency Support**
   - Currency management
   - Exchange rate updates
   - Auto-conversion

### Phase 4: Advanced Features (3-4 weeks)
9. **4th Level spreadsheet**
   - Grid component
   - Cell formulas
   - Link to Details Level

10. **Library System**
    - Save budget components
    - Retrieve and insert
    - Library manager

---

## 8. API Endpoints Needed

```javascript
// Globals
GET    /api/globals?production_id=:id
POST   /api/globals
PUT    /api/globals/:id
DELETE /api/globals/:id

// Groups
GET    /api/groups?production_id=:id
POST   /api/groups
PUT    /api/groups/:id
DELETE /api/groups/:id

// Contractual Charges
GET    /api/contractual-charges?production_id=:id
POST   /api/contractual-charges
PUT    /api/contractual-charges/:id
DELETE /api/contractual-charges/:id

// Shortcuts
GET    /api/shortcuts
POST   /api/shortcuts
PUT    /api/shortcuts/:id
DELETE /api/shortcuts/:id
POST   /api/shortcuts/:id/apply -- Apply shortcut to budget

// Fringe Ranges
GET    /api/fringe-ranges?budget_line_item_id=:id
POST   /api/fringe-ranges
PUT    /api/fringe-ranges/:id
DELETE /api/fringe-ranges/:id

// Budget Preferences
GET    /api/budget-preferences/:production_id
PUT    /api/budget-preferences/:production_id

// Comparison/Variance
POST   /api/productions/:id/lock-original-totals
POST   /api/productions/:id/update-original-totals
GET    /api/productions/:id/variance-report
```

---

## 9. Key Technical Considerations

### Calculation Performance
- MMB recalculates entire budget on any change
- We need efficient recalculation triggers
- Consider: debounced recalc, calculation queue, worker threads

### Formula Parsing
- Need robust formula parser for Globals and Details
- Support: `=GLOBAL_NAME`, `=A1+B1`, `=SUM(range)`, etc.
- Consider: Using existing library (mathjs, formulajs)

### Decimal Precision
- Critical for budget accuracy
- Use DECIMAL type in database (not FLOAT)
- Configure precision per field type

### Audit Trail
- Track all budget changes
- Who changed what, when
- Enable rollback/undo

### Data Validation
- Prevent invalid fringe applications
- Validate formulas before save
- Check account number formats

---

## 10. User Experience Insights

### What Makes MMB Powerful
1. **Keyboard Shortcuts**: Power users love keyboard navigation
2. **Auto-complete**: Units, Globals auto-expand
3. **Dedicated Columns**: AGG, FRIN, GRP, LOC, SET visible at Details Level
4. **Formula Maker**: Visual tool for building formulas (not just text entry)
5. **Print Flexibility**: Extensive print customization
6. **Comparison Mode**: Easy to see budget changes

### What We Should Avoid
1. Over-complicated UI for simple tasks
2. Requiring too many clicks for common operations
3. Hidden features (make them discoverable)
4. Slow recalculation (MMB is instant)

---

## 11. Next Steps

1. **Complete Manual Analysis**: Read remaining chunks (pages 51-167)
   - Focus on: Formula Maker, Library, Budget Comparison, Printing

2. **Analyze Real Budgets**: Use actual budgets to validate structure
   - Reverse-engineer line items
   - Identify common patterns
   - Test our calculation engine

3. **Process Tax Incentive Guide**: Extract comprehensive state-by-state data

4. **Build Core Features**: Start with Globals → Contractual Charges → Groups

5. **Create AI Features**: Layer AI on top of standard budgeting
   - AI scenario generation
   - Predictive rate suggestions
   - Budget optimization recommendations

---

## Conclusion

Movie Magic Budgeting provides a comprehensive blueprint for professional production budgeting. Our AI Budget System should:

1. **Match core functionality**: Hierarchy, Fringes, Calculations
2. **Enhance with AI**: Predictive analytics, scenario generation, optimization
3. **Simplify UX**: Modern interface, better discoverability
4. **Add unique value**: Union rate integration, live tax incentive data, AI-powered insights

**The killer feature**: Combine MMB's proven structure with AI-powered budgeting assistance that automatically applies correct union rates, suggests optimal crew configurations, and identifies cost-saving opportunities.
