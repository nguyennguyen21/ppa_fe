
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './modules/lib/hook/theme-context'
import { PrefsProvider } from './modules/lib/hook/prefs-context'
import { ToastProvider } from './modules/lib/Components/UI/feedback/Toast'
import { ConfirmProvider } from './modules/lib/Components/UI/feedback/ConfirmDialog'
import { GuidanceProvider } from './modules/lib/Components/UI/guidance/Guidance'
import { BackendDataProvider } from './modules/lib/hook/backend-data-context'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PrefsProvider>
        <BackendDataProvider>
        <ToastProvider>
          <ConfirmProvider>
            <GuidanceProvider>
              <App />
            </GuidanceProvider>
          </ConfirmProvider>
        </ToastProvider>
        </BackendDataProvider>
        </PrefsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
