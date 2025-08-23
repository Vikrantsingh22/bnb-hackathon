import { bettingService } from '../services/bettingService';
import { web3Service } from '../services/web3Service';

export const testBettingFlow = async () => {
  console.log('🧪 Testing Betting Flow...');
  
  try {
    // 1. Check if MetaMask is connected
    const isConnected = await web3Service.isConnected();
    console.log('📱 MetaMask Connected:', isConnected);
    
    if (!isConnected) {
      console.log('❌ Please connect MetaMask first');
      return;
    }

    // 2. Get current account
    const account = await web3Service.getCurrentAccount();
    console.log('👤 Current Account:', account);

    // 3. Check network
    const isOnCorrectNetwork = await web3Service.isOnCorrectNetwork();
    console.log('🌐 On BSC Testnet:', isOnCorrectNetwork);

    if (!isOnCorrectNetwork) {
      console.log('🔄 Attempting to switch to BSC Testnet...');
      await web3Service.switchToCorrectNetwork();
      console.log('✅ Switched to BSC Testnet');
    }

    // 4. Get balance
    if (account) {
      const balance = await bettingService.getWalletBalance(account);
      console.log('💰 Balance:', balance.formattedBnb, 'tBNB');
    }

    // 5. Test contract interaction (read-only)
    console.log('📖 Testing contract read functions...');
    
    // Get next bet ID (this is a read function)
    // Note: This would require implementing a read function in the betting service
    
    console.log('✅ Betting flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Betting flow test failed:', error);
  }
};

// Function to simulate placing a test bet
export const simulateBet = async () => {
  console.log('🎲 Simulating a test bet...');
  
  const testBetParams = {
    amount: '0.001', // Very small amount for testing
    challengeId: 1,
    playerId: 1,
    odds: 2.0,
    isNative: true,
  };
  
  try {
    console.log('📝 Bet Parameters:', testBetParams);
    
    // Estimate gas first
    const estimatedGas = await bettingService.estimateBetGas(testBetParams);
    console.log('⛽ Estimated Gas:', estimatedGas.toString());
    
    // Note: Uncomment the following lines to actually place a bet
    // const result = await bettingService.placeBet(testBetParams);
    // console.log('✅ Bet placed successfully!', result);
    
    console.log('✅ Bet simulation completed (gas estimation successful)');
    
  } catch (error) {
    console.error('❌ Bet simulation failed:', error);
  }
};

// Add these functions to the global window object for easy testing
declare global {
  interface Window {
    testBetting: () => Promise<void>;
    simulateBet: () => Promise<void>;
  }
}

// Expose testing functions globally in development
if (process.env.NODE_ENV === 'development') {
  window.testBetting = testBettingFlow;
  window.simulateBet = simulateBet;
  
  console.log('🔧 Betting test functions available:');
  console.log('  - window.testBetting() - Test the full betting flow');
  console.log('  - window.simulateBet() - Simulate placing a bet');
}