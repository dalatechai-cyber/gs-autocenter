# Product Validation Guide

This guide explains how to verify that all 226 products are properly loaded in the Japan Tok chatbot.

## Overview

The chatbot syncs product data from Google Sheets. It's designed to handle exactly **226 products**. The validation system ensures:

1. ✅ Product count matches the expected 226 products
2. ✅ All products have required fields (name, TOK code, OEM code, model)
3. ✅ Products are accessible and complete

## Validation Methods

### Method 1: Command Line Script (Recommended for Development)

The command line script provides the most detailed output and is ideal for development and debugging.

**Usage:**

```bash
npm run check:products
```

**What it checks:**
- Product count vs expected (226)
- Field completeness for each product
- Shows sample products
- Lists incomplete products with details

**Example Output:**

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

1. Name: PRIUS ZVW30 БАМПЕР УРДТАЛ ХӨНГӨН/Light Bumper Front
   TOK Code: TOK-001
   OEM Code: 52119-47070
   Model: Prius ZVW30
   Price (with VAT): 68,200 ₮
   Stock: 1

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

**Exit Codes:**
- `0` = Success
- `1` = Error or warning

### Method 2: API Endpoint (Recommended for Production Monitoring)

The API endpoint provides a quick JSON response and is ideal for:
- Production health checks
- Automated monitoring
- Integration with other tools

**Usage:**

```bash
# Via curl
curl https://your-project.vercel.app/api/validate-products

# Or open in browser
https://your-project.vercel.app/api/validate-products
```

**Response Format:**

```json
{
  "status": "success",
  "productCount": {
    "total": 226,
    "expected": 226,
    "difference": 0,
    "complete": 226,
    "incomplete": 0
  },
  "validation": {
    "countMatches": true,
    "allComplete": true,
    "overall": true
  },
  "message": "✅ All 226 products are present and complete!",
  "timestamp": "2025-12-13T07:00:00.000Z"
}
```

**Response Fields:**
- `status`: "success" or "error"
- `productCount.total`: Actual number of products loaded
- `productCount.expected`: Expected count (226)
- `productCount.difference`: Difference between actual and expected
- `productCount.complete`: Number of products with all required fields
- `productCount.incomplete`: Number of products missing fields
- `validation.overall`: `true` if everything is perfect
- `message`: Human-readable summary
- `timestamp`: When the check was performed

## Required Product Fields

Each product must have these fields:

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Product name/title | "PRIUS ZVW30 БАМПЕР УРДТАЛ" |
| `tokCode` | TOK code | "TOK-001" |
| `oemCode` | OEM code | "52119-47070" |
| `model` | Car model | "Prius ZVW30" |

Optional but recommended fields:
- `priceWithVat`: Price with VAT
- `stock`: Stock quantity
- `brand`: Brand name

## Troubleshooting

### "Missing GOOGLE_SHEET_URL environment variable"

**Solution:** Set the `GOOGLE_SHEET_URL` in your `.env` file:

```bash
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
```

### "Failed to download sheet: 403"

**Solution:** Make sure your Google Sheet is published:
1. Open your Google Sheet
2. Go to File → Share → Publish to web
3. Select "Entire Document" and "Comma-separated values (.csv)"
4. Click "Publish"
5. Copy the CSV URL

### "Product count does not match expected value"

**Possible causes:**
1. Google Sheet has been updated with new/removed products
2. Empty rows in the sheet are being counted
3. Products with missing required fields are filtered out

**Solution:**
1. Check your Google Sheet for empty rows
2. Verify all products have required fields
3. Update `EXPECTED_PRODUCT_COUNT` in the code if the count has legitimately changed

### "Some products have missing fields"

**Solution:**
1. Run the command line script to see which products are incomplete
2. Check the Google Sheet for those products
3. Fill in missing fields (name, TOK code, OEM code, model)
4. Re-run the validation

## Integration Examples

### Health Check Script

Add to your CI/CD pipeline:

```bash
#!/bin/bash
# Check products as part of deployment
npm run check:products
if [ $? -eq 0 ]; then
    echo "Product validation passed"
    exit 0
else
    echo "Product validation failed"
    exit 1
fi
```

### Monitoring Service

Use the API endpoint with monitoring tools:

```bash
# Check every 5 minutes
*/5 * * * * curl https://your-project.vercel.app/api/validate-products | jq '.validation.overall'
```

### JavaScript/Node.js

```javascript
const response = await fetch('https://your-project.vercel.app/api/validate-products');
const validation = await response.json();

if (!validation.validation.overall) {
    console.error('Product validation failed:', validation.message);
    // Send alert
}
```

## Updating Expected Product Count

If your product catalog grows or shrinks, update the expected count in two places:

1. **Script:** `scripts/check-products.js`
   ```javascript
   const EXPECTED_PRODUCT_COUNT = 226; // Change this number
   ```

2. **API:** `api/validate-products.js`
   ```javascript
   const EXPECTED_PRODUCT_COUNT = 226; // Change this number
   ```

3. **README:** Update the README.md to reflect the new count

## Best Practices

1. **Run validation regularly** - At least weekly to catch data issues early
2. **Monitor in production** - Set up automated checks using the API endpoint
3. **Validate before deployment** - Include in your CI/CD pipeline
4. **Keep documentation updated** - If the product count changes, update all references
5. **Investigate discrepancies** - Don't ignore validation warnings

## Support

If you encounter issues with product validation:
1. Check the troubleshooting section above
2. Review the [scripts/README.md](../scripts/README.md) for script-specific help
3. Contact technical support at 99997571, 88105143
