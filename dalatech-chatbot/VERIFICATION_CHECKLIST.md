# Deployment Verification Checklist

After this PR is merged and deployed to Vercel, verify the following:

## ✅ Static Files Accessibility

Test that all static files are accessible:

```bash
# Test widget.js loads
curl -I https://dalatech-chatbot.vercel.app/widget.js
# Expected: 200 OK, Content-Type: application/javascript

# Test main page loads
curl -I https://dalatech-chatbot.vercel.app/
# Expected: 200 OK, Content-Type: text/html

# Test logo loads
curl -I https://dalatech-chatbot.vercel.app/logo.jpg
# Expected: 200 OK, Content-Type: image/jpeg

# Test favicon (should redirect to logo)
curl -I https://dalatech-chatbot.vercel.app/favicon.ico
# Expected: 200 OK
```

## ✅ API Endpoints

Test that API endpoints work:

```bash
# Test health endpoint
curl https://dalatech-chatbot.vercel.app/api/health

# Test chat endpoint
curl -X POST https://dalatech-chatbot.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[]}'
# Expected: JSON response with AI reply
```

## ✅ Widget Embedding

Create a test HTML file and verify the widget loads:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Test Page</h1>
    <p>The chatbot widget should appear in the bottom-right corner.</p>
    
    <!-- Embed the widget -->
    <script async src="https://dalatech-chatbot.vercel.app/widget.js"></script>
</body>
</html>
```

Verify:
- ✅ Widget button appears in bottom-right corner
- ✅ Clicking button opens chat interface
- ✅ Chat interface displays correctly
- ✅ Sending a message works
- ✅ AI responds to messages
- ✅ Widget state persists on page navigation

## ✅ Test Pages

Visit the built-in test pages:
- https://dalatech-chatbot.vercel.app/test-page1.html
- https://dalatech-chatbot.vercel.app/test-page2.html
- https://dalatech-chatbot.vercel.app/embed-demo.html

## ✅ Browser Console

Open browser console and verify:
- ✅ No 404 errors for widget.js
- ✅ No CORS errors
- ✅ No JavaScript errors
- ✅ Widget initializes successfully

## ✅ Vercel Dashboard

Check Vercel dashboard:
- ✅ Build completed successfully
- ✅ Deployment status is "Ready"
- ✅ No build errors or warnings
- ✅ Functions deployed correctly (in Functions tab)

## Common Issues and Solutions

### Issue: widget.js returns 404
**Solution**: Check that:
1. `outputDirectory` in vercel.json points to `dalatech-messenger/public`
2. Build command completed successfully
3. widget.js exists in the public directory

### Issue: API endpoints return 404
**Solution**: Check that:
1. `/api` symlink exists in repository root
2. Vercel detected the serverless functions
3. Functions tab in Vercel shows the API endpoints

### Issue: CORS errors
**Solution**: Check that:
1. API handlers apply CORS correctly
2. `ALLOWED_ORIGINS` environment variable is set (if needed)
3. Widget is loading from the same domain or CORS is configured for cross-origin

### Issue: Build fails
**Solution**: Check that:
1. All dependencies are in `dalatech-messenger/package.json`
2. Build commands are correct in vercel.json
3. Node.js version is compatible (v20+ recommended)

## Environment Variables

Ensure these environment variables are set in Vercel:

- `GEMINI_API_KEY` - Required for AI functionality
- `GOOGLE_SHEET_URL` - Required for product data
- `ALLOWED_ORIGINS` - Optional, for restricting CORS

## Security Checklist

- ✅ No secrets in repository
- ✅ API keys in environment variables only
- ✅ CORS configured appropriately
- ✅ Rate limiting enabled (30 req/min)
- ✅ Input validation and sanitization active

## Performance Checklist

- ✅ Widget loads asynchronously
- ✅ CSS and JS are minified
- ✅ Images are optimized
- ✅ API responses are fast (< 3s)

## Documentation

- ✅ DEPLOYMENT_FIX.md explains the solution
- ✅ README.md has embedding instructions
- ✅ EMBED_GUIDE.md provides detailed integration guide
