'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { ReactNode, useEffect } from 'react';

interface WalletGuardProps {
  children: ReactNode;
  className?: string;
}

export const WalletGuard: React.FC<WalletGuardProps> = ({ children, className = "w-full" }) => {
  const { connected } = useWallet();
  // rerender when connected or disconnected
  useEffect(() => {
    console.log('connected', connected);
  }, [connected]);
  if (connected) {
    return <>{children}</>;
  }

  return <WalletMultiButton className={className}>connect wallet</WalletMultiButton>;
}; 