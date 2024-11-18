import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Web3Provider } from '@0xstt/builderkit'

const CHAINS = [{
  id: 43113,
  name: 'Avalanche Fuji',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche Fuji',
    symbol: 'AVAX',
  },
  rpcUrls: {
    default: { http: ['https://api.avax-test.network/ext/bc/C/rpc'] },
  },
  blockExplorers: {
    default: {
      name: 'SnowTrace',
      url: 'https://testnet.snowtrace.io',
    },
  },
}];

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Web3Provider appName="Flows - Faucet" projectId="YOUR_PROJECT_ID" chains={CHAINS}>
      <App />
    </Web3Provider>
  </StrictMode>,
)
