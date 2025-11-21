#!/bin/bash
# Database Backup Script for AI Budget System
# Usage: ./backup_database.sh [output_directory]

set -e

# Configuration
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:fokBnhssuYOYzrtLlUuGkuvHOCrhAejf@caboose.proxy.rlwy.net:14463/railway}"
OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${OUTPUT_DIR}/ai_budget_backup_${TIMESTAMP}.sql"
RATE_CARDS_FILE="${OUTPUT_DIR}/rate_cards_${TIMESTAMP}.csv"
ALIASES_FILE="${OUTPUT_DIR}/job_aliases_${TIMESTAMP}.csv"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "=========================================="
echo "AI Budget System Database Backup"
echo "=========================================="
echo "Timestamp: $(date)"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# Check for psql
PSQL=$(which psql || which /opt/homebrew/opt/postgresql@16/bin/psql || echo "")
if [ -z "$PSQL" ]; then
    echo "ERROR: psql not found. Please install PostgreSQL."
    exit 1
fi

echo "Using psql: $PSQL"
echo ""

# Export rate cards to CSV
echo "Exporting rate_cards table to CSV..."
$PSQL "$DATABASE_URL" -c "\COPY (SELECT * FROM rate_cards ORDER BY union_local, job_classification) TO STDOUT WITH CSV HEADER" > "$RATE_CARDS_FILE"
RATE_COUNT=$(wc -l < "$RATE_CARDS_FILE")
echo "  Exported $((RATE_COUNT - 1)) rate cards to $RATE_CARDS_FILE"

# Export job aliases to CSV
echo "Exporting job_classification_aliases table to CSV..."
$PSQL "$DATABASE_URL" -c "\COPY (SELECT * FROM job_classification_aliases ORDER BY alias) TO STDOUT WITH CSV HEADER" > "$ALIASES_FILE" 2>/dev/null || echo "  (aliases table may not exist yet)"
if [ -f "$ALIASES_FILE" ]; then
    ALIAS_COUNT=$(wc -l < "$ALIASES_FILE")
    echo "  Exported $((ALIAS_COUNT - 1)) aliases to $ALIASES_FILE"
fi

# Full database dump
echo ""
echo "Creating full database dump..."
pg_dump "$DATABASE_URL" --no-owner --no-privileges > "$BACKUP_FILE" 2>/dev/null || {
    echo "  pg_dump not available, skipping full dump"
    rm -f "$BACKUP_FILE"
}

if [ -f "$BACKUP_FILE" ]; then
    DUMP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "  Full dump created: $BACKUP_FILE ($DUMP_SIZE)"
fi

# Create JSON export of rate cards
JSON_FILE="${OUTPUT_DIR}/rate_cards_${TIMESTAMP}.json"
echo ""
echo "Creating JSON export..."
$PSQL "$DATABASE_URL" -t -A -c "
SELECT json_agg(row_to_json(t))
FROM (
    SELECT
        id, union_local, job_classification, rate_type,
        base_rate, location, production_type,
        effective_date, contract_year
    FROM rate_cards
    ORDER BY union_local, job_classification
) t
" > "$JSON_FILE"
JSON_SIZE=$(du -h "$JSON_FILE" | cut -f1)
echo "  JSON export created: $JSON_FILE ($JSON_SIZE)"

# Summary
echo ""
echo "=========================================="
echo "Backup Complete!"
echo "=========================================="
echo ""
echo "Files created:"
ls -lh "$OUTPUT_DIR"/*_${TIMESTAMP}* 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "Database Statistics:"
$PSQL "$DATABASE_URL" -t -A -c "
SELECT 'Total rate_cards: ' || COUNT(*) FROM rate_cards
UNION ALL
SELECT 'Unique unions: ' || COUNT(DISTINCT union_local) FROM rate_cards
UNION ALL
SELECT 'Unique positions: ' || COUNT(DISTINCT job_classification) FROM rate_cards
UNION ALL
SELECT 'Job aliases: ' || COALESCE((SELECT COUNT(*) FROM job_classification_aliases), 0)
"
echo ""
echo "Backup files saved to: $OUTPUT_DIR"
