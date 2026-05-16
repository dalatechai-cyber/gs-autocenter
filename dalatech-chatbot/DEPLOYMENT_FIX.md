# Deployment Fix for Widget.js Loading Issue

## Problem Summary
The DalaTech chatbot widget.js file was not loading at `https://dalatech-chatbot.vercel.app/widget.js` due to incorrect Vercel deployment configuration.

## Root Cause
The repository uses a subdirectory structure (`dalatech-messenger/`) containing all application code, but Vercel was deploying from the repository root without proper configuration to handle this structure.

### Specific Issues:
1. **No root-level `vercel.json`**: Vercel couldn't find deployment configuration
2. **Incorrect output path**: Static files in `dalatech-messenger/public/` weren't served at root URL
3. **Missing API routes**: Serverless functions in `dalatech-messenger/api/` weren't accessible at `/api/*` endpoints
4. **No package.json at root**: Node.js module configuration was missing

## Solution Implemented

### 1. Created Root-Level `vercel.json`
```json
{
  "buildCommand": "cd dalatech-messenger && npm install && npm run build:css && npm run build:react",
  "outputDirectory": "dalatech-messenger/public",
  "installCommand": "cd dalatech-messenger && npm install",
  "rewrites": [
    {
      "source": "/favicon.ico",
      "destination": "/logo.jpg"
    }
  ]
}
```

This tells Vercel to:
- Navigate to `dalatech-messenger/` subdirectory
- Install dependencies and run build commands there
- Serve static files from `dalatech-messenger/public/` at the root URL
- Redirect favicon.ico requests to logo.jpg (browsers support JPEG favicons)

### 2. Created Symbolic Link for API Routes
```bash
ln -s dalatech-messenger/api api
```

This makes the serverless functions accessible at `/api/*` endpoints as Vercel expects.

### 3. Added Root-Level `package.json`
```json
{
  "name": "dalatech-chatbot",
  "version": "1.0.0",
  "private": true,
  "type": "module"
}
```

This ensures Vercel uses ES modules (required by the API code).

## Result

After deployment with these changes:
- ✅ `https://dalatech-chatbot.vercel.app/widget.js` - Widget loads successfully
- ✅ `https://dalatech-chatbot.vercel.app/api/chat` - API endpoint accessible
- ✅ `https://dalatech-chatbot.vercel.app/` - Main app serves correctly
- ✅ All static assets (logo.jpg, styles.css, etc.) accessible

## Files Changed
- **Added**: `/vercel.json` - Vercel deployment configuration
- **Added**: `/package.json` - Root package configuration
- **Added**: `/api` - Symbolic link to `dalatech-messenger/api`

## Testing the Widget

To test the widget on any website:

```html
<script async src="https://dalatech-chatbot.vercel.app/widget.js"></script>
```

The widget will:
1. Load the JavaScript from the URL above
2. Initialize the chat interface
3. Connect to the `/api/chat` endpoint for AI responses
4. Store conversation history in localStorage
5. Work across page navigation while maintaining state

## CORS Configuration

The API already includes CORS handling in `dalatech-messenger/lib/cors.js`:
- Allows all origins by default (suitable for embeddable widget)
- Can be restricted via `ALLOWED_ORIGINS` environment variable if needed
- Handles preflight OPTIONS requests correctly

## Environment Variables (Optional)

If you need to restrict which domains can embed the widget:

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://anotherdomain.com
```

## Verification Steps

1. Check widget loads:
   ```bash
   curl -I https://dalatech-chatbot.vercel.app/widget.js
   # Should return: 200 OK with Content-Type: application/javascript
   ```

2. Check API endpoint:
   ```bash
   curl -X POST https://dalatech-chatbot.vercel.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"test","history":[]}'
   # Should return: JSON response with AI reply
   ```

3. Visual test:
   - Open `https://dalatech-chatbot.vercel.app/test-page1.html`
   - Click the chat widget button
   - Send a test message
   - Navigate to test-page2.html
   - Verify widget state persists

## Future Considerations

### Option 1: Flatten Structure (Not Recommended)
Could move all files to repository root, but this would:
- Require significant refactoring
- Break existing relative imports
- Not provide significant benefits

### Option 2: Use Vercel Project Settings (Alternative)
In Vercel dashboard, could set "Root Directory" to `dalatech-messenger/`, but:
- Requires manual configuration per deployment
- Not version controlled
- Current solution is better as it's in the repository

### Current Solution: Root-Level Configuration (Recommended)
- ✅ Minimal changes required
- ✅ Version controlled
- ✅ Works automatically for all deployments
- ✅ Maintains existing code structure
- ✅ Easy to understand and maintain
