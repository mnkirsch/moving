import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HubProvider } from './context/HubContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HubProvider>
      <App />
    </HubProvider>
  </StrictMode>
)
