#!/usr/bin/env python3
"""Split Movie Magic Budgeting Manual into smaller chunks for analysis"""

import os
from pypdf import PdfReader, PdfWriter

# Input and output paths
input_pdf = "/Users/anthonyvazquez/Documents/budgets/MMB Manual/47125706-MMB-User-Manual.pdf"
output_dir = "/Users/anthonyvazquez/Documents/budgets/MMB Manual/chunks"

# Create output directory
os.makedirs(output_dir, exist_ok=True)

# Load the PDF
reader = PdfReader(input_pdf)
total_pages = len(reader.pages)

print(f"📄 Movie Magic Budgeting Manual: {total_pages} pages")
print(f"📁 Output directory: {output_dir}\n")

# Split into chunks of 25 pages
chunk_size = 25
chunk_num = 1

for start_page in range(0, total_pages, chunk_size):
    end_page = min(start_page + chunk_size, total_pages)

    # Create a new PDF for this chunk
    writer = PdfWriter()

    # Add pages to this chunk
    for page_num in range(start_page, end_page):
        writer.add_page(reader.pages[page_num])

    # Save the chunk
    output_file = os.path.join(output_dir, f"mmb-manual-chunk-{chunk_num:02d}-pages-{start_page+1}-{end_page}.pdf")
    with open(output_file, "wb") as output_pdf:
        writer.write(output_pdf)

    print(f"✓ Chunk {chunk_num}: Pages {start_page+1}-{end_page} → {os.path.basename(output_file)}")
    chunk_num += 1

print(f"\n✅ Split complete! Created {chunk_num-1} chunks")
print(f"📂 Location: {output_dir}")
