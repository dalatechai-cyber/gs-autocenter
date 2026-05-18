# Scripts

This directory contains utility scripts for the Japan Tok chatbot.

## check-products.js

Validates that all 226 products are properly loaded from Google Sheets and have the required fields.

### Usage

```bash
# Using npm script (recommended)
npm run check:products

# Or directly with node
node scripts/check-products.js
```

### Requirements

- `GOOGLE_SHEET_URL` environment variable must be set (in `.env` file)
- Node.js with ES modules support
- Internet connectivity to access Google Sheets

### What it checks

1. **Product Count**: Verifies that exactly 226 products are loaded
2. **Required Fields**: Checks that each product has:
   - `name` (Product name)
   - `tokCode` (TOK code)
   - `oemCode` (OEM code)
   - `model` (Car model)
3. **Field Completeness**: Reports any products with missing or empty fields

### Output

The script provides:
- Product count comparison (expected vs actual)
- List of incomplete products with missing fields
- Sample of first 5 products
- Summary statistics

### Exit Codes

- `0`: Success - All 226 products present and complete
- `1`: Error - Product count mismatch or incomplete products

### Example Output

```
🔍 Checking product details from Google Sheets...

📥 Fetching products from Google Sheets...
✅ Successfully fetched 226 products

📊 Product Count Validation:
   Expected: 226 products
   Actual: 226 products
   ✅ Product count matches!

🔎 Validating product fields...
   ✅ All products have required fields

📦 Sample Products (first 5):
...

============================================================
📋 SUMMARY:
============================================================
Total products: 226
Expected: 226
Complete products: 226
Incomplete products: 0

✅ SUCCESS: All 226 products are present and complete!
```
