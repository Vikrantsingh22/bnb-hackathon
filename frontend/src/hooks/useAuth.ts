import { useState, useEffect, useCallback } from 'react';
import { web3Service } from '../services/web3Service';
import type { WalletInfo } from '../services/web3Service';

interface AuthState {
  isConnected: boolean;
  wallet: WalletInfo | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isConnected: false,
    wallet: null,
    isLoading: true,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const walletInfo = await web3Service.connectMetaMask();
      setAuthState({
        isConnected: true,
        wallet: walletInfo,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState({
        isConnected: false,
        wallet: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      });
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    await web3Service.disconnect();
    setAuthState({
      isConnected: false,
      wallet: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const checkConnection = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const isConnected = await web3Service.isConnected();
      if (isConnected) {
        const account = await web3Service.getCurrentAccount();
        if (account) {
          // Get wallet info if connected
          const walletInfo = await web3Service.connectMetaMask();
          setAuthState({
            isConnected: true,
            wallet: walletInfo,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            isConnected: false,
            wallet: null,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setAuthState({
          isConnected: false,
          wallet: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setAuthState({
        isConnected: false,
        wallet: null,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        checkConnection();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [checkConnection, disconnectWallet]);

  return {
    ...authState,
    connectWallet,
    disconnectWallet,
    checkConnection,
  };
};