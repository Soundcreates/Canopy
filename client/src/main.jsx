import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WalletProvider } from './contexts/WalletContext'
import { ForestRegistryProvider } from './contexts/ForestRegistryContext'
import { CarbonCreditNFTProvider } from './contexts/CarbonCreditNFTContext'
import { SelectedForestProvider } from './contexts/SelectedForestContext'
import { OrganisationProvider } from './contexts/OrganisationContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WalletProvider>
      <ForestRegistryProvider>
        <CarbonCreditNFTProvider>
          <SelectedForestProvider>
            <OrganisationProvider>
              <App />
            </OrganisationProvider>
          </SelectedForestProvider>
        </CarbonCreditNFTProvider>
      </ForestRegistryProvider>
    </WalletProvider>
  </StrictMode>,
)
