import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './components/ChatWidget.jsx';

// Create a container for the widget
const widgetContainer = document.createElement('div');
widgetContainer.id = 'dalatech-chat-widget-root';
document.body.appendChild(widgetContainer);

// Render the React component
const root = ReactDOM.createRoot(widgetContainer);
root.render(
  <React.StrictMode>
    <ChatWidget />
  </React.StrictMode>
);

// Mark widget as initialized
window.__DALATECH_REACT_WIDGET_INITIALIZED__ = true;
