# BNBCAT Betting Setup Guide

## Overview

This guide explains how to set up and use the end-to-end MetaMask betting functionality with the BSC Testnet smart contract.

## Smart Contract Details

- **Contract Address**: `0x77076fe32766ca211aae5a3db175d17b81ab451f`
- **Network**: BSC Testnet (Chain ID: 97)
- **Block Explorer**: https://testnet.bscscan.com/address/0x77076fe32766ca211aae5a3db175d17b81ab451f

## Prerequisites

1. **MetaMask Extension**: Install MetaMask browser extension
2. **BSC Testnet Setup**: Add BSC Testnet to MetaMask (the app will help you do this automatically)
3. **Test BNB**: Get test BNB from BSC Testnet faucet:
   - Visit: https://testnet.binance.org/faucet-smart
   - Enter your wallet address and claim test BNB

## Setup Steps

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Connect MetaMask
1. Open the app in your browser
2. Click "Connect MetaMask" button
3. Approve the connection in MetaMask
4. The app will automatically prompt you to switch to BSC Testnet

### 4. Add BSC Testnet to MetaMask (if not added automatically)
If the automatic network switch doesn't work, add manually:
- **Network Name**: BSC Testnet
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Chain ID**: 97
- **Symbol**: tBNB
- **Block Explorer**: https://testnet.bscscan.com

## How to Place a Bet

### 1. Through the UI
1. Browse available matches on the home page
2. Click on a team to bet on
3. The betting modal will open
4. Select your stake amount (minimum 0.01 tBNB)
5. Confirm the transaction in MetaMask
6. Wait for confirmation and view on BSCScan

### 2. Testing Functions (Development Only)
Open browser console and use these functions:

```javascript
// Test the complete betting flow
await window.testBetting();

// Simulate a bet (gas estimation only)
await window.simulateBet();
```

## Betting Parameters

The betting function uses these parameters:
- **amount**: Stake amount in tBNB (e.g., "0.01")
- **challengeId**: Match/Challenge ID (derived from match.matchID)
- **playerId**: 1 for team1, 2 for team2
- **odds**: Multiplier (e.g., 2.5 for 2.5x payout)
- **isNative**: true (for BNB betting)

## Transaction Flow

1. **Connect Wallet**: User connects MetaMask
2. **Network Check**: App ensures BSC Testnet is selected
3. **Balance Check**: Verify sufficient tBNB balance
4. **Place Bet**: Call smart contract's `participate` function
5. **Confirmation**: Wait for blockchain confirmation
6. **Receipt**: Display transaction hash and bet ID

## Smart Contract Functions Used

### `participate()`
Places a bet with the following parameters:
- `uint256 amount`: Bet amount in wei
- `uint256 challengeId`: Challenge/match identifier
- `uint256 playerId`: Team selection (1 or 2)
- `enum ParticipationType participationType`: Always BET (0)
- `bool isNative`: true for BNB betting
- `address tokenAddress`: WBNB address for native betting
- `uint256 _odds`: Odds multiplied by 100

### Read Functions
- `getBetDetails(betId)`: Get details of a specific bet
- `getChallengeBets(challengeId, playerId)`: Get all bets for a team
- `getUserDeposit(user, token)`: Get user's deposit balance

## Error Handling

The app handles these common errors:
- **MetaMask not installed**: Shows installation prompt
- **Wrong network**: Provides network switch button
- **Insufficient balance**: Prevents transaction submission
- **Transaction failed**: Displays error message with details
- **Contract errors**: Decodes and shows user-friendly messages

## Security Features

- **Network validation**: Ensures transactions only on BSC Testnet
- **Balance validation**: Prevents overspending
- **Gas estimation**: Estimates transaction costs before execution
- **Transaction monitoring**: Tracks transaction status in real-time

## Troubleshooting

### MetaMask Connection Issues
- Refresh the page and try connecting again
- Check if MetaMask is unlocked
- Ensure you're on the correct account

### Network Issues
- Use the "Switch to BSC Testnet" button in the app
- Manually add BSC Testnet if automatic addition fails
- Check MetaMask network list

### Transaction Failures
- Ensure sufficient tBNB balance for both bet amount and gas
- Check if the contract is active and accessible
- Verify bet parameters are within allowed limits

### Balance Issues
- Get test BNB from the faucet
- Wait for faucet transactions to confirm
- Refresh the app to update balance display

## Contract Events

The app listens for these smart contract events:
- **ParticipateEvent**: Emitted when a bet is placed
- **SettleChallengeEvent**: Emitted when bets are settled

## Development Notes

- Uses Viem library for blockchain interactions
- Supports both MetaMask and WalletConnect
- Implements proper error handling and user feedback
- Includes comprehensive transaction status tracking
- Features glassmorphism UI design with BNB color scheme

## Support

For issues or questions:
1. Check browser console for detailed error messages
2. Verify BSC Testnet configuration
3. Ensure sufficient test BNB balance
4. Check transaction on BSCScan for confirmation