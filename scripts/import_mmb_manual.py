#!/usr/bin/env python3
"""
Import Movie Magic Budgeting Manual into the reference_docs database table.
Extracts text from PDF chunks and stores with metadata for easy searching.
"""

import os
import re
import psycopg2
from pypdf import PdfReader

# Configuration
CHUNKS_DIR = "/Users/anthonyvazquez/Documents/budgets/MMB Manual/chunks"
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Topic keywords for categorizing content
TOPIC_KEYWORDS = {
    'fringes': ['fringe', 'payroll', 'health', 'welfare', 'pension', 'iatse', 'dga', 'sag', 'wga'],
    'budget_hierarchy': ['topsheet', 'account', 'category', 'detail', 'level', 'hierarchy'],
    'globals': ['global', 'variable', 'reusable'],
    'groups': ['group', 'prep', 'shoot', 'wrap', 'post'],
    'units': ['unit', 'day', 'week', 'hour', 'allow', 'flat'],
    'formulas': ['formula', 'calculation', 'math', 'compute'],
    'currency': ['currency', 'exchange', 'rate', 'conversion'],
    'tax_incentives': ['tax', 'credit', 'incentive', 'rebate'],
    'contractual_charges': ['contractual', 'overhead', 'fee', 'producer'],
    'locations': ['location', 'set', 'studio'],
    'comparison': ['comparison', 'variance', 'original', 'current'],
    'shortcuts': ['shortcut', 'template', 'library'],
    'printing': ['print', 'report', 'export', 'pdf'],
}


def extract_topics(text):
    """Extract relevant topics from text content."""
    text_lower = text.lower()
    found_topics = set()

    for topic, keywords in TOPIC_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                found_topics.add(topic)
                break

    return list(found_topics) if found_topics else ['general']


def extract_section_title(text):
    """Try to extract a section title from the beginning of the text."""
    lines = text.strip().split('\n')[:10]
    for line in lines:
        line = line.strip()
        # Look for chapter or section headings
        if re.match(r'^(Chapter|Section|\d+\.)\s+', line, re.IGNORECASE):
            return line[:100]
        # Look for all-caps titles
        if line.isupper() and len(line) > 5 and len(line) < 80:
            return line
    return None


def parse_chunk_filename(filename):
    """Extract page range from chunk filename."""
    match = re.search(r'pages-(\d+)-(\d+)', filename)
    if match:
        return int(match.group(1)), int(match.group(2))
    return None, None


def generate_summary(text, max_length=500):
    """Generate a brief summary from the text content."""
    # Clean up text
    text = re.sub(r'\s+', ' ', text).strip()

    # Take first few sentences
    sentences = re.split(r'[.!?]+', text)
    summary = ''
    for sentence in sentences[:5]:
        sentence = sentence.strip()
        if sentence and len(sentence) > 20:
            if len(summary) + len(sentence) < max_length:
                summary += sentence + '. '
            else:
                break

    return summary.strip() if summary else text[:max_length] + '...'


def import_manual():
    """Main function to import the MMB manual into the database."""
    print("=" * 60)
    print("Movie Magic Budgeting Manual Import")
    print("=" * 60)

    # Check if chunks exist
    if not os.path.exists(CHUNKS_DIR):
        print(f"ERROR: Chunks directory not found: {CHUNKS_DIR}")
        return

    # Get list of PDF chunks
    chunks = sorted([f for f in os.listdir(CHUNKS_DIR) if f.endswith('.pdf')])
    print(f"\nFound {len(chunks)} PDF chunks to process")

    # Connect to database
    print(f"\nConnecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Clear existing MMB manual entries
    cursor.execute("""
        DELETE FROM reference_docs
        WHERE doc_name = 'Movie Magic Budgeting User Manual'
    """)
    deleted = cursor.rowcount
    if deleted > 0:
        print(f"Cleared {deleted} existing manual entries")

    total_pages = 0
    total_chars = 0

    for chunk_file in chunks:
        chunk_path = os.path.join(CHUNKS_DIR, chunk_file)
        page_start, page_end = parse_chunk_filename(chunk_file)

        print(f"\nProcessing: {chunk_file}")
        print(f"  Pages: {page_start}-{page_end}")

        # Extract text from PDF
        try:
            reader = PdfReader(chunk_path)
            text_pages = []

            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_pages.append(page_text)

            full_text = '\n\n--- PAGE BREAK ---\n\n'.join(text_pages)

            # Extract metadata
            section = extract_section_title(full_text)
            topics = extract_topics(full_text)
            summary = generate_summary(full_text)

            print(f"  Extracted: {len(full_text)} characters")
            print(f"  Topics: {', '.join(topics)}")
            if section:
                print(f"  Section: {section}")

            # Insert into database
            cursor.execute("""
                INSERT INTO reference_docs
                (doc_name, doc_type, source, section, page_start, page_end, content, summary, topics)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                'Movie Magic Budgeting User Manual',
                'manual',
                '47125706-MMB-User-Manual.pdf',
                section,
                page_start,
                page_end,
                full_text,
                summary,
                topics
            ))

            total_pages += len(text_pages)
            total_chars += len(full_text)

        except Exception as e:
            print(f"  ERROR: {e}")

    # Also import the analysis document
    analysis_path = "/Users/anthonyvazquez/ai-budget-system/docs/movie-magic-analysis.md"
    if os.path.exists(analysis_path):
        print(f"\nImporting analysis document...")
        with open(analysis_path, 'r') as f:
            analysis_content = f.read()

        cursor.execute("""
            INSERT INTO reference_docs
            (doc_name, doc_type, source, section, content, summary, topics)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            'Movie Magic Budgeting Analysis',
            'analysis',
            'movie-magic-analysis.md',
            'Feature Analysis for AI Budget System',
            analysis_content,
            'Comprehensive analysis of MMB features for AI Budget System development. Covers hierarchy, fringes, globals, groups, shortcuts, currency, tax credits, and implementation roadmap.',
            ['fringes', 'budget_hierarchy', 'globals', 'groups', 'units', 'currency', 'tax_incentives', 'contractual_charges', 'comparison', 'shortcuts']
        ))
        print(f"  Imported: {len(analysis_content)} characters")

    # Commit changes
    conn.commit()

    # Get final counts
    cursor.execute("SELECT COUNT(*) FROM reference_docs WHERE doc_name LIKE 'Movie Magic%'")
    doc_count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print("Import Complete!")
    print("=" * 60)
    print(f"  Documents imported: {doc_count}")
    print(f"  Total pages: {total_pages}")
    print(f"  Total characters: {total_chars:,}")
    print("\nYou can now query the manual using SQL:")
    print("  SELECT section, page_start, page_end, summary")
    print("  FROM reference_docs")
    print("  WHERE 'fringes' = ANY(topics);")


if __name__ == "__main__":
    import_manual()
