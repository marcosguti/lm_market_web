import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App.tsx'

const hideInitialLoader = () => {
  const loader = document.getElementById('initial-loader-container')
  const root = document.getElementById('root')

  if (loader && root) {
    loader.style.display = 'none'
    root.style.display = 'block'
  }
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

hideInitialLoader()

