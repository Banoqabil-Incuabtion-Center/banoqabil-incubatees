import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from "./components/theme-provider"



import { registerSW } from 'virtual:pwa-register'

// FORCE UNREGISTER OLD ONESIGNAL WORKERS (Self-Healing Fix)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      const scriptURL = registration.active?.scriptURL || '';
      if (scriptURL.includes('OneSignal') || scriptURL.includes('OneSignalSDK')) {
        console.log('Found zombie OneSignal worker, killing it...', registration);
        registration.unregister().then(boolean => {
          if (boolean) {
            console.log('Successfully unregistered old worker.');
            window.location.reload(); // Reload to take effect immediately
          }
        });
      }
    }
  });
}


import { QueryProvider } from "./components/QueryProvider"


const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
)


