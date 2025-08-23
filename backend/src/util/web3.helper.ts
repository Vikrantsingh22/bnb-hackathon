import { ethers } from "ethers";
import logger from "./winstonLogger";

// Contract ABI - imported from artifacts
const ESCROW_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "DebugEvent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "challengeId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum MultiTokenEscrow.ParticipationType",
        "name": "participationType",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isNative",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "odds",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      }
    ],
    "name": "ParticipateEvent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "betIds",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "payoutAmounts",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "challengeId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isNative",
        "type": "bool"
      }
    ],
    "name": "SettleChallengeEvent",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "TokenWhitelisted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "TransferFailedEvent",
    "type": "event"
  },
  {
    "stateMutability": "payable",
    "type": "fallback"
  },
  {
    "inputs": [],
    "name": "MAX_BATCH_SIZE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WBNB",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "betDetails",
    "outputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "odds",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isNative",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "settled",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bnbBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bnbLiabilities",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "challengeBets",
    "outputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "odds",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isNative",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "settled",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "challengeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getBetCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "count",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      }
    ],
    "name": "getBetDetails",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "odds",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "tokenAddress",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isNative",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "settled",
            "type": "bool"
          }
        ],
        "internalType": "struct MultiTokenEscrow.Bet",
        "name": "bet",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "challengeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "getChallengeBets",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "user",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "odds",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "tokenAddress",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "isNative",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "settled",
            "type": "bool"
          }
        ],
        "internalType": "struct MultiTokenEscrow.Bet[]",
        "name": "bets",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "isTokenWhitelisted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextBetId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "challengeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      },
      {
        "internalType": "enum MultiTokenEscrow.ParticipationType",
        "name": "participationType",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "isNative",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_odds",
        "type": "uint256"
      }
    ],
    "name": "participate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "betId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "challengeId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "playerId",
        "type": "uint256"
      }
    ],
    "name": "settleChallengePlayer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "tokenBalances",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      }
    ],
    "name": "whitelistToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "whitelistedTokens",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// Helper function to get environment variables and validate them
function getEnvironmentConfig() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC;
  const ESCROW_ADDRESS = process.env.ESCROW_ADDRESS;

  if (!PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }
  if (!BSC_TESTNET_RPC) {
    throw new Error("BSC_TESTNET_RPC environment variable is required");
  }
  if (!ESCROW_ADDRESS) {
    throw new Error("ESCROW_ADDRESS environment variable is required");
  }

  return { PRIVATE_KEY, BSC_TESTNET_RPC, ESCROW_ADDRESS };
}

// Helper function to initialize Web3 components
function initializeWeb3() {
  const { PRIVATE_KEY, BSC_TESTNET_RPC, ESCROW_ADDRESS } = getEnvironmentConfig();
  
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const escrowContract = new ethers.Contract(ESCROW_ADDRESS, ESCROW_ABI, wallet);
  
  return { provider, wallet, escrowContract };
}

/**
 * Settle bets on-chain for a specific challenge and player
 * @param challengeId - The challenge ID
 * @param playerId - The player ID (1 for team1, 2 for team2)
 * @returns Transaction hash if successful, error object if failed
 */
export async function settleOnChain(challengeId: number, playerId: number): Promise<{ success: boolean, txHash?: string, error?: string }> {
  try {
    const { escrowContract } = initializeWeb3();
    
    logger.info(`Initiating on-chain settlement for challengeId: ${challengeId}, playerId: ${playerId}`);
    
    // Check if there are any bets to settle
    const betCount = await escrowContract.getBetCount(challengeId, playerId);
    
    if (betCount === BigInt(0)) {
      logger.info(`No bets found for challengeId: ${challengeId}, playerId: ${playerId}`);
      return { success: true, txHash: "NO_BETS_TO_SETTLE" };
    }
    
    logger.info(`Found ${betCount.toString()} bets to settle for challengeId: ${challengeId}, playerId: ${playerId}`);
    
    // Estimate gas for the transaction
    const gasEstimate = await escrowContract.settleChallengePlayer.estimateGas(challengeId, playerId);
    
    // Add 20% buffer to gas estimate
    const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);
    
    logger.info(`Gas estimate: ${gasEstimate.toString()}, Gas limit: ${gasLimit.toString()}`);
    
    // Execute the settlement transaction
    const tx = await escrowContract.settleChallengePlayer(challengeId, playerId, {
      gasLimit: gasLimit
    });
    
    logger.info(`Settlement transaction sent. Hash: ${tx.hash}`);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    if (receipt?.status === 1) {
      logger.info(`Settlement transaction confirmed. Hash: ${tx.hash}, Block: ${receipt.blockNumber}`);
      return { success: true, txHash: tx.hash };
    } else {
      logger.error(`Settlement transaction failed. Hash: ${tx.hash}`);
      return { success: false, error: "Transaction failed" };
    }
    
  } catch (error: any) {
    logger.error(`Error in on-chain settlement: ${error.message}`, error);
    
    // Parse specific error messages
    if (error.message.includes("No bets found")) {
      return { success: true, txHash: "NO_BETS_TO_SETTLE" };
    } else if (error.message.includes("insufficient funds")) {
      return { success: false, error: "Insufficient funds for gas" };
    } else if (error.message.includes("execution reverted")) {
      return { success: false, error: `Contract execution reverted: ${error.reason || error.message}` };
    } else {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Get bet details for a specific challenge and player
 * @param challengeId - The challenge ID
 * @param playerId - The player ID
 * @returns Array of bet details
 */
export async function getChallengeBets(challengeId: number, playerId: number) {
  try {
    const { escrowContract } = initializeWeb3();
    const bets = await escrowContract.getChallengeBets(challengeId, playerId);
    return bets;
  } catch (error: any) {
    logger.error(`Error fetching challenge bets: ${error.message}`);
    throw error;
  }
}

/**
 * Get contract balance information
 * @returns Balance information
 */
export async function getContractBalances() {
  try {
    const { escrowContract } = initializeWeb3();
    const bnbBalance = await escrowContract.bnbBalance();
    const bnbLiabilities = await escrowContract.bnbLiabilities();
    
    return {
      bnbBalance: ethers.formatEther(bnbBalance),
      bnbLiabilities: ethers.formatEther(bnbLiabilities)
    };
  } catch (error: any) {
    logger.error(`Error fetching contract balances: ${error.message}`);
    throw error;
  }
}

/**
 * Check if wallet has sufficient gas for settlement
 * @returns Boolean indicating if wallet has enough BNB for gas
 */
export async function checkGasBalance(): Promise<boolean> {
  try {
    const { provider, wallet } = initializeWeb3();
    const balance = await provider.getBalance(wallet.address);
    const minGasBalance = ethers.parseEther("0.001"); // Minimum 0.001 BNB for gas
    
    logger.info(`Wallet balance: ${ethers.formatEther(balance)} BNB`);
    
    return balance >= minGasBalance;
  } catch (error: any) {
    logger.error(`Error checking gas balance: ${error.message}`);
    return false;
  }
}
