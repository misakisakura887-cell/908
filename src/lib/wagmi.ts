import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'mirror-ai-default';

const connectors = projectId && projectId !== 'mirror-ai-default'
  ? [injected(), walletConnect({ projectId })]
  : [injected()]; // 没有 WalletConnect projectId 时只用 injected (MetaMask)

export const config = createConfig({
  chains: [mainnet, arbitrum],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
});
