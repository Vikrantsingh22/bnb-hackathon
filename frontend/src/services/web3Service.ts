import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../config/contract';
import { bettingService } from './bettingService';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
}

class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async connectMetaMask(): Promise<WalletInfo | null> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Initialize betting service wallet client
      await bettingService.initializeWallet();

      // Try to switch to BSC testnet
      try {
        await bettingService.switchToBSCTestnet();
      } catch (networkError) {
        console.warn('Could not switch to BSC testnet:', networkError);
        // Continue with current network for now
      }

      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();

      return {
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
      };
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!window.ethereum) return false;
      
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      
      return accounts.length > 0;
    } catch (error) {
      return false;
    }
  }

  async getCurrentAccount(): Promise<string | null> {
    try {
      if (!this.provider) {
        if (!window.ethereum) return null;
        this.provider = new ethers.BrowserProvider(window.ethereum);
      }

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });

      return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      return null;
    }
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  async isOnCorrectNetwork(): Promise<boolean> {
    try {
      if (!window.ethereum) return false;
      
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });
      
      const currentChainId = parseInt(chainId, 16);
      return currentChainId === CONTRACT_CONFIG.chainId;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  async switchToCorrectNetwork(): Promise<void> {
    try {
      await bettingService.switchToBSCTestnet();
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  }
}

export const web3Service = new Web3Service();