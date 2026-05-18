# Deployment Guide

This guide will help you deploy the Japan Tok Mongolia chatbot to Vercel.

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Google Gemini API key (from https://aistudio.google.com/app/apikeys)
- Google Sheet with products (CSV export enabled)

## Step 1: Prepare Your Repository

```bash
# Navigate to your project directory
cd japantok-chatbot

# Initialize git if not already done
git init

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/japantok-chatbot.git

# Commit all files
git add .
git commit -m "Initial commit"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select your `japantok-chatbot` repository
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: (leave default)
   - Output Directory: (leave default)
   - Click "Deploy"

## Step 3: Add Environment Variables

After the initial deployment:

1. **Go to Project Settings**
   - Click on your project
   - Navigate to Settings → Environment Variables

2. **Add Required Variables**

   **GEMINI_API_KEY**
   - Name: `GEMINI_API_KEY`
   - Value: Your API key from https://aistudio.google.com/app/apikeys
   - Click "Add"

   **GOOGLE_SHEET_URL**
   - Name: `GOOGLE_SHEET_URL`
   - Value: Your Google Sheet CSV export URL
   - Format: `https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv`
   - Click "Add"

3. **Optional Variables**
   
   **ALLOWED_ORIGINS** (for CORS)
   - Name: `ALLOWED_ORIGINS`
   - Value: `https://yourwebsite.com,https://another-site.com`
   - Click "Add"

4. **Save and Redeploy**
   - Go to Deployments tab
   - Click "..." on the latest deployment
   - Click "Redeploy"

## Step 4: Verify Deployment

Your chatbot is now live at: `https://your-project-name.vercel.app`

Test it by:
1. Opening the URL in your browser
2. Typing a product search query
3. Verifying the response

## Step 5: Embed on Your Website

Add this script tag to your website's HTML (before closing `</body>` tag):

```html
<script
  async
  src="https://your-project-name.vercel.app/widget.js"
  data-japantok-widget
  data-api-origin="https://your-project-name.vercel.app"
></script>
```

The chatbot widget will appear as a button in the bottom-right corner.

## Google Sheet Setup

### Required Columns

Your Google Sheet must include these columns (Mongolian or English names):

- **Барааны нэр** or **Product Name** - Product name
- **TOK код** or **TOK CODE** - Internal product code
- **OEM код** or **OEM** - OEM part number
- **Загвар** or **Model** - Vehicle model
- **Үнэ (НӨАТ-тэй)** or **Price (with VAT)** - Price including VAT
- **Үнэ (НӨАТ-гүй)** or **Price (without VAT)** - Price excluding VAT
- **Нөөц** or **Stock** - Stock status

### Publishing Your Sheet

1. Open your Google Sheet
2. Click **File** → **Share** → **Publish to web**
3. Select **Entire Document** and **Comma-separated values (.csv)**
4. Click **Publish**
5. Copy the URL (starts with `https://docs.google.com/spreadsheets/d/e/...`)
6. Paste this URL into your Vercel environment variables

## Updating Your Chatbot

To update your chatbot after deployment:

```bash
# Make your changes locally
# Edit files as needed

# Commit changes
git add .
git commit -m "Description of your changes"

# Push to GitHub
git push origin main
```

Vercel will automatically detect the changes and redeploy your chatbot.

## Troubleshooting

### Chatbot shows "Connection Error"
- Check if environment variables are set correctly in Vercel
- Verify your GEMINI_API_KEY is valid
- Ensure your Google Sheet URL is accessible

### No products found
- Verify your Google Sheet is published as CSV
- Check column names match the expected format
- Ensure sheet contains data rows

### Widget not appearing
- Check the script tag is added correctly
- Verify the API origin URL is correct
- Check browser console for errors

## Support

For additional help:
- Check project README.md
- Review Vercel logs in the dashboard
- Contact: 99997571, 88105143

## Security Checklist

Before going live, ensure:
- ✅ `.env` file is in `.gitignore`
- ✅ API keys are stored only in Vercel environment variables
- ✅ Google Sheet doesn't contain sensitive data
- ✅ CORS origins are configured if needed
- ✅ Test on different devices and browsers

