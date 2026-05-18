# 🚀 DalaTech.ai Chatbot - Embeddable Widget Guide

## Quick Start - Add to Your Website

Want to add DalaTech.ai chatbot to your website? Just copy and paste this code before the closing `</body>` tag:

```html
<!-- DalaTech.ai Chatbot Widget -->
<button id="dalatech-chat-toggle"
        aria-label="Open chat"
        style="position: fixed; bottom: 20px; right: 20px; z-index: 99999; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #2B2B2B 0%, #1F1F1F 100%); border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer; overflow: hidden; padding: 0; transition: transform 0.3s ease, box-shadow 0.2s; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #ECECEC;">
  💬
</button>

<div id="dalatech-chatbot-container"
     style="display: none; position: fixed; bottom: 90px; right: 20px; width: 400px; height: 600px; max-height: 80vh; background: #1F1F1F; border-radius: 16px; box-shadow: 0 5px 40px rgba(0,0,0,0.5); z-index: 99999; overflow: hidden; border: 1px solid #333;">
  <iframe src="https://dalatech-chatbot.vercel.app"
          width="100%" height="100%" frameborder="0"
          style="border-radius: 16px;"
          title="DalaTech.ai Chatbot"></iframe>
</div>

<style>
  #dalatech-chat-toggle:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  }
  
  @media (max-width: 480px) {
    #dalatech-chatbot-container {
      width: calc(100% - 32px) !important;
      height: 70vh !important;
      bottom: 90px !important;
      right: 16px !important;
    }
  }
</style>

<script>
  (function() {
    const container = document.getElementById('dalatech-chatbot-container');
    const btn = document.getElementById('dalatech-chat-toggle');

    if (!container || !btn) {
      console.error('DalaTech chatbot elements not found');
      return;
    }

    btn.addEventListener('click', function() {
      const isHidden = container.style.display === 'none' || container.style.display === '';
      container.style.display = isHidden ? 'block' : 'none';
      btn.style.transform = isHidden ? 'rotate(45deg)' : 'rotate(0deg)';
      btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });
  })();
</script>
```

**That's it!** The chatbot will appear in the bottom-right corner of your website.

## Features

✅ **Easy Installation** - One code snippet, no dependencies  
✅ **Responsive Design** - Works on mobile, tablet, and desktop  
✅ **Customizable** - Change colors, position, size, and icon  
✅ **Secure** - Isolated iframe, no conflicts with your site  
✅ **AI Powered** - Smart responses using Google Gemini AI  
✅ **No External Dependencies** - Pure HTML, CSS, and JavaScript  

## Customization Options

### Change the Button Icon

Replace the emoji `💬` with your own:

```html
<!-- With a different emoji -->
🤖

<!-- With your logo image -->
<img src="/your-logo.png" 
     alt="Chat" 
     style="width: 100%; height: 100%; object-fit: cover;">
```

### Change Position

Modify the `bottom` and `right` values:

```css
/* Bottom-right (default) */
bottom: 20px;
right: 20px;

/* Bottom-left */
bottom: 20px;
left: 20px;

/* Top-right */
top: 20px;
right: 20px;
```

### Change Button Size

```css
/* Button */
width: 60px;
height: 60px;

/* Make it bigger */
width: 80px;
height: 80px;
```

### Change Chat Window Size

```css
/* Container */
width: 400px;
height: 600px;

/* Make it bigger */
width: 500px;
height: 700px;
```

### Change Colors

```css
/* Button background - change the gradient */
background: linear-gradient(135deg, #2B2B2B 0%, #1F1F1F 100%);

/* Or use a solid color */
background: #2563eb;

/* Container background */
background: #1F1F1F;
```

## Examples

### WordPress

Add the code to your theme's `footer.php` before `</body>`:

```php
<!-- DalaTech.ai Chatbot Widget -->
<!-- Paste the embed code here -->
<?php wp_footer(); ?>
</body>
</html>
```

### Shopify

Go to **Online Store → Themes → Edit Code → Layout → theme.liquid** and add the code before `</body>`.

### HTML Website

Add the code before `</body>` in your HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
</head>
<body>
    <!-- Your content here -->
    
    <!-- DalaTech.ai Chatbot Widget -->
    <!-- Paste the embed code here -->
</body>
</html>
```

### React/Next.js

Create a component or add to your layout:

```jsx
// Add to your layout or _app.js
useEffect(() => {
  // The embed code as a script
  const script = document.createElement('script');
  script.innerHTML = `
    // Paste the JavaScript part of the embed code here
  `;
  document.body.appendChild(script);
  
  // Add the HTML elements
  const chatHTML = \`
    <!-- Paste the button and container HTML here -->
  \`;
  document.body.insertAdjacentHTML('beforeend', chatHTML);
}, []);
```

## Demo Pages

Visit these pages to see the widget in action:

- **Embed Demo**: `/embed-demo.html` - See the widget working with full styling
- **Embed Guide**: `/embed-guide.html` - Complete installation guide with copy button
- **Embed Snippet**: `/embed-snippet.html` - Raw code snippet for easy copying

## React Component Version

We also provide a React component version for modern React applications. See `src/components/ChatWidget.jsx` and use:

```bash
npm run build:react
```

Then include in your React app:

```jsx
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatWidget />
    </div>
  );
}
```

## Troubleshooting

### Button doesn't appear

- Make sure you pasted the code before `</body>` tag
- Check for JavaScript errors in browser console
- Ensure no other elements have higher `z-index` than 99999

### Chatbot doesn't load in iframe

- Verify the iframe `src` URL is correct and accessible
- Check if your hosting allows iframe embedding
- Open the iframe URL directly in browser to test

### Button conflicts with other elements

- Adjust the `z-index` value if needed
- Change `bottom` and `right` positions
- Modify button size if it overlaps with other UI elements

### Mobile not responsive

- Ensure the viewport meta tag is in your `<head>`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ```

## Support

Need help? Contact us:

- 📧 Email: dalatech.ai@gmail.com
- 📱 Phone: 99273339
- 🌐 Website: https://dalatech.ai

## Advanced Integration

For advanced customization, API access, or custom branding, please contact our team.

---

**Powered by DalaTech.ai** - AI-powered business automation solutions
