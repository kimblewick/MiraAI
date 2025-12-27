import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { validateConfig, logConfig } from '@/config/env.js'

// Validate environment configuration on startup
validateConfig();

// Log configuration in debug mode
logConfig();

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 