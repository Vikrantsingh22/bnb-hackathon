import { 
  createPublicClient, 
  createWalletClient, 
  custom, 
  parseEther, 
  formatEther, 
  getContract,
  Hash,
  TransactionReceipt
} from 'viem';
import { bscTestnet } from 'viem/chains';
import { CONTRACT_CONFIG, CONTRACT_ABI, WBNB_ADDRESS, ParticipationType } from '../config/contract';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface BetParams {
  amount: string; // In ether units (e.g., "0.1" for 0.1 BNB)
  challengeId: number;
  playerId: number; // 1 for team1, 2 for team2
  odds: number; // Multiplier (e.g., 2.5)
  isNative: boolean; // true for BNB, false for tokens
  tokenAddress?: string; // Required if isNative is false
}

export interface BetResult {
  hash: Hash;
  betId?: number;
  receipt?: TransactionReceipt;
}

export interface WalletBalance {
  bnb: string;
  formattedBnb: string;
}

class BettingService {
  private publicClient;
  private walletClient: any = null;

  constructor() {
    // Create public client for read operations
    this.publicClient = createPublicClient({
      chain: bscTestnet,
      transport: custom(window.ethereum || {}),
    });
  }

  async initializeWallet(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    // Create wallet client for write operations
    this.walletClient = createWalletClient({
      chain: bscTestnet,
      transport: custom(window.ethereum),
    });
  }

  async switchToBSCTestnet(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Try to switch to BSC Testnet
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}`,
              chainName: CONTRACT_CONFIG.chainName,
              nativeCurrency: CONTRACT_CONFIG.nativeCurrency,
              rpcUrls: [CONTRACT_CONFIG.rpcUrl],
              blockExplorerUrls: [CONTRACT_CONFIG.blockExplorer],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  async getWalletBalance(address: string): Promise<WalletBalance> {
    const balance = await this.publicClient.getBalance({ address: address as `0x${string}` });
    return {
      bnb: balance.toString(),
      formattedBnb: formatEther(balance),
    };
  }

  async placeBet(betParams: BetParams): Promise<BetResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not initialized. Call initializeWallet() first.');
    }

    const account = await this.walletClient.getAddresses();
    if (!account || account.length === 0) {
      throw new Error('No wallet account found');
    }

    // Ensure we're on the correct network
    await this.switchToBSCTestnet();

    // Create contract instance
    const contract = getContract({
      address: CONTRACT_CONFIG.address,
      abi: CONTRACT_ABI,
      client: {
        public: this.publicClient,
        wallet: this.walletClient,
      },
    });

    try {
      // Convert odds to the format expected by the contract (multiplied by 100)
      const contractOdds = Math.round(betParams.odds * 100);
      
      // Convert amount to wei
      const amountInWei = parseEther(betParams.amount);

      // Prepare transaction parameters
      const txParams = {
        account: account[0],
        args: [
          amountInWei, // amount
          BigInt(betParams.challengeId), // challengeId
          BigInt(betParams.playerId), // playerId
          ParticipationType.BET, // participationType (always BET for our use case)
          betParams.isNative, // isNative
          (betParams.tokenAddress || WBNB_ADDRESS) as `0x${string}`, // tokenAddress
          BigInt(contractOdds), // odds
        ],
        value: betParams.isNative ? amountInWei : 0n, // Send BNB only if isNative is true
      };

      console.log('Placing bet with params:', {
        amount: betParams.amount,
        amountInWei: amountInWei.toString(),
        challengeId: betParams.challengeId,
        playerId: betParams.playerId,
        odds: contractOdds,
        isNative: betParams.isNative,
        tokenAddress: betParams.tokenAddress || WBNB_ADDRESS,
        value: txParams.value.toString(),
      });

      // Execute the transaction
      const hash = await contract.write.participate(txParams.args, {
        account: account[0],
        value: txParams.value,
      });

      console.log('Transaction sent:', hash);

      // Wait for transaction receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction confirmed:', receipt);

      // Extract bet ID from the ParticipateEvent
      let betId: number | undefined;
      if (receipt.logs && receipt.logs.length > 0) {
        // Find the ParticipateEvent log and decode it
        for (const log of receipt.logs) {
          try {
            if (log.topics[0] && log.address.toLowerCase() === CONTRACT_CONFIG.address.toLowerCase()) {
              // For simplicity, we'll extract the betId from the log data
              // In a production app, you'd want to properly decode the event
              console.log('Event log found:', log);
              // The betId is typically in the last part of the event data
              // This is a simplified extraction - in production, use proper event decoding
            }
          } catch (error) {
            console.log('Error decoding log:', error);
          }
        }
      }

      return {
        hash,
        betId,
        receipt,
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  async getBetDetails(betId: number) {
    const contract = getContract({
      address: CONTRACT_CONFIG.address,
      abi: CONTRACT_ABI,
      client: this.publicClient,
    });

    try {
      const betDetails = await contract.read.getBetDetails([BigInt(betId)]);
      return {
        user: betDetails.user,
        amount: formatEther(betDetails.amount),
        odds: Number(betDetails.odds) / 100, // Convert back from contract format
        tokenAddress: betDetails.tokenAddress,
        isNative: betDetails.isNative,
        settled: betDetails.settled,
      };
    } catch (error) {
      console.error('Error getting bet details:', error);
      throw error;
    }
  }

  async getChallengeBets(challengeId: number, playerId: number) {
    const contract = getContract({
      address: CONTRACT_CONFIG.address,
      abi: CONTRACT_ABI,
      client: this.publicClient,
    });

    try {
      const bets = await contract.read.getChallengeBets([BigInt(challengeId), BigInt(playerId)]);
      return bets.map((bet: any) => ({
        user: bet.user,
        amount: formatEther(bet.amount),
        odds: Number(bet.odds) / 100,
        tokenAddress: bet.tokenAddress,
        isNative: bet.isNative,
        settled: bet.settled,
      }));
    } catch (error) {
      console.error('Error getting challenge bets:', error);
      throw error;
    }
  }

  // Utility function to estimate gas for a bet transaction
  async estimateBetGas(betParams: BetParams): Promise<bigint> {
    if (!this.walletClient) {
      throw new Error('Wallet not initialized');
    }

    const account = await this.walletClient.getAddresses();
    if (!account || account.length === 0) {
      throw new Error('No wallet account found');
    }

    const contractOdds = Math.round(betParams.odds * 100);
    const amountInWei = parseEther(betParams.amount);

    try {
      const gas = await this.publicClient.estimateContractGas({
        address: CONTRACT_CONFIG.address,
        abi: CONTRACT_ABI,
        functionName: 'participate',
        args: [
          amountInWei,
          BigInt(betParams.challengeId),
          BigInt(betParams.playerId),
          ParticipationType.BET,
          betParams.isNative,
          (betParams.tokenAddress || WBNB_ADDRESS) as `0x${string}`,
          BigInt(contractOdds),
        ],
        account: account[0],
        value: betParams.isNative ? amountInWei : 0n,
      });

      return gas;
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }
}

export const bettingService = new BettingService();