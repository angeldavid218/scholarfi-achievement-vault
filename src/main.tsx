import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.tsx'
import { testScholarFiProgramConnection } from './connection'
import { SolanaProvider } from './providers/solanaProvider.tsx'

// Anchor's Borsh coder expects Node's Buffer in browser runtimes.
const globalWithBuffer = globalThis as typeof globalThis & { Buffer?: typeof Buffer }
if (typeof globalWithBuffer.Buffer === 'undefined') {
  globalWithBuffer.Buffer = Buffer
}

void testScholarFiProgramConnection().then((result) => {
  const label = '[ScholarFi Achievement Vault] on-chain program check'
  if (result.ok) {
    console.info(`${label} OK`, result)
  } else {
    console.warn(`${label} failed`, result)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SolanaProvider>
      <div className="min-h-screen font-sans antialiased">
        <App />
      </div>
    </SolanaProvider>
  </StrictMode>,
)
