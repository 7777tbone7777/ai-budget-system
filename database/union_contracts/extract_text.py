#!/usr/bin/env python3
"""
Phase 1: Extract text from union contract PDFs
This is a fast, offline extraction that creates .txt files from PDFs.
No API calls - just text extraction using pdfplumber.
"""

import os
import sys
import pdfplumber
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "extracted_text"

def extract_text_from_pdf(pdf_path: Path) -> tuple[str, int]:
    """Extract text from a PDF file, page by page."""
    all_text = []
    page_count = 0

    try:
        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                if text.strip():
                    all_text.append(f"\n--- PAGE {i+1} of {page_count} ---\n")
                    all_text.append(text)
    except Exception as e:
        print(f"  ERROR: {e}")
        return "", 0

    return "\n".join(all_text), page_count

def process_directory(dir_path: Path, output_subdir: Path):
    """Process all PDFs in a directory."""
    pdf_files = list(dir_path.glob("*.pdf"))

    if not pdf_files:
        return 0

    output_subdir.mkdir(parents=True, exist_ok=True)
    processed = 0

    for pdf_file in pdf_files:
        output_file = output_subdir / f"{pdf_file.stem}.txt"

        # Skip if already extracted
        if output_file.exists():
            print(f"  [SKIP] {pdf_file.name} (already extracted)")
            processed += 1
            continue

        print(f"  [EXTRACT] {pdf_file.name}...", end=" ", flush=True)

        text, pages = extract_text_from_pdf(pdf_file)

        if text:
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"SOURCE: {pdf_file.name}\n")
                f.write(f"PAGES: {pages}\n")
                f.write("="*60 + "\n\n")
                f.write(text)

            size_kb = output_file.stat().st_size / 1024
            print(f"OK ({pages} pages, {size_kb:.1f}KB)")
            processed += 1
        else:
            print("FAILED (no text extracted)")

    return processed

def main():
    print("=" * 60)
    print("UNION CONTRACT TEXT EXTRACTION")
    print("=" * 60)
    print(f"\nBase directory: {BASE_DIR}")
    print(f"Output directory: {OUTPUT_DIR}\n")

    OUTPUT_DIR.mkdir(exist_ok=True)

    total_processed = 0

    # Process each subdirectory
    for subdir in sorted(BASE_DIR.iterdir()):
        if subdir.is_dir() and not subdir.name.startswith('.') and subdir.name != "extracted_text" and subdir.name != "extracted":
            pdf_count = len(list(subdir.glob("*.pdf")))
            if pdf_count > 0:
                print(f"\n[{subdir.name}] ({pdf_count} PDFs)")
                output_subdir = OUTPUT_DIR / subdir.name
                processed = process_directory(subdir, output_subdir)
                total_processed += processed

    print("\n" + "=" * 60)
    print(f"COMPLETE: Extracted text from {total_processed} PDFs")
    print(f"Output location: {OUTPUT_DIR}")
    print("=" * 60)

    # Show summary of extracted files
    print("\nExtracted text files:")
    for txt_file in sorted(OUTPUT_DIR.rglob("*.txt")):
        size_kb = txt_file.stat().st_size / 1024
        rel_path = txt_file.relative_to(OUTPUT_DIR)
        print(f"  {rel_path} ({size_kb:.1f}KB)")

if __name__ == "__main__":
    main()
