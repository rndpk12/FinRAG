import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './atlas.css'
import './atlas-more.css'
import './atlas-footer.css'
import './atlas-type.css'
import './atlas-layout.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
