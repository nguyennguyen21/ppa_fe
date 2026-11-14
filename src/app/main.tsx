
import { createRoot } from 'react-dom/client'
import '../index.css'
import App from './App.tsx'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '../shared/hook/theme-context'
import { PrefsProvider } from '../shared/hook/prefs-context'
import { ToastProvider } from '../shared/Components/UI/feedback/Toast'
import { ConfirmProvider } from '../shared/Components/UI/feedback/ConfirmDialog'
import { GuidanceProvider } from '../shared/Components/UI/guidance/Guidance'
import { BackendDataProvider } from '../shared/hook/backend-data-context'

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
