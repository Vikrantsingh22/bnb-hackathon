// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MultiTokenEscrow is Ownable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;
    
    // Equivalent to ParticipationType in the Solana contract
    enum ParticipationType { SideBet, JoinChallenge }

    // Main state variables
    mapping(address => uint256) public tokenBalances;
    mapping(address => mapping(address => uint256)) public userDeposits; // user => token => amount
    mapping(address => bool) public whitelistedTokens;
    
    // NEW: Store user odds for each challenge and player combination
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userOdds; // user => challengeId => playerId => odds
    
    address[] public supportedTokens;
    uint256 public bnbBalance;
    uint256 public bnbLiabilities;
    
    // WBNB contract address on BNB Smart Chain
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    
    // BEP-95 Integration - Fee collection and burning
    uint256 public constant BURN_FEE_BASIS_POINTS = 25; // 0.25% fee for burning
    uint256 public constant BASIS_POINTS_DENOMINATOR = 10000;
    uint256 public accumulatedBurnFees;
    uint256 public totalBurnedAmount;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Per-user nonces for EIP-712 signatures
    mapping(address => uint256) public userNonces;
    
    // Batch settlement parameters
    uint256 public constant MAX_BATCH_SIZE = 100;
    
    // EIP-712 type hash for participation
    bytes32 public constant PARTICIPATE_TYPEHASH = keccak256(
        "Participate(address user,uint256 amount,uint256 challengeId,uint256 playerId,uint8 participationType,bool isNative,address tokenAddress,uint256 nonce)"
    );

    // Events
    event ParticipateEvent(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 challengeId,
        uint256 playerId,
        ParticipationType participationType,
        bool isNative,
        uint256 nonce,
        uint256 odds // NEW: Added odds to event
    );

    event SettleChallengeEvent(
        address indexed token,
        uint256[] amounts,
        uint256 challengeId,
        address[] winners,
        bool isNative
    );

    event FalseSettlementEvent(
        address indexed user,
        address indexed token,
        uint256 amount,
        string txnId,
        bool isNative
    );

    event SendEvent(
        address indexed to,
        address indexed token,
        uint256 amount,
        bool isNative
    );

    event TokenWhitelisted(address indexed token);
    event TokenRemoved(address indexed token);
    event ForcedBnbDetected(uint256 amount);
    event TransferFailedEvent(address indexed token, address indexed to, uint256 amount);
    
    // BEP-95 Events
    event BurnFeesCollected(uint256 amount);
    event BnbBurned(uint256 amount);

    // Custom errors with context
    error Unauthorized();
    error InsufficientFunds(address token, uint256 requested, uint256 available);
    error UnsupportedCurrency(address token);
    error TransferFailed(address token, address to, uint256 amount);
    error InvalidInput();
    error InvalidAmount();
    error TokenNotFound(address token);
    error BatchSizeExceeded(uint256 requested, uint256 maxAllowed);
    error InvalidSignature();
    error DirectBnbNotAllowed();
    error TokenAlreadyWhitelisted(address token);
    error TokenHasBalance(address token, uint256 balance);
    error InvalidOdds(); // NEW: Added for odds validation

    constructor() 
        Ownable(msg.sender) 
        EIP712("MultiTokenEscrow", "1") 
    {
        // Native BNB is implicitly supported
        whitelistedTokens[address(0)] = true;
        
        // Auto-whitelist WBNB
        whitelistedTokens[WBNB] = true;
        supportedTokens.push(WBNB);
    }

    /**
     * @notice Whitelist a token for use in the escrow
     * @param tokenAddress Address of the token to whitelist
     */
    function whitelistToken(address tokenAddress) external onlyOwner {
        if (whitelistedTokens[tokenAddress]) {
            revert TokenAlreadyWhitelisted(tokenAddress);
        }
        
        whitelistedTokens[tokenAddress] = true;
        supportedTokens.push(tokenAddress);
        
        emit TokenWhitelisted(tokenAddress);
    }

    /**
     * @notice Calculate burn fee for BEP-95 integration
     * @param amount The transaction amount
     * @return burnFee The fee to be collected for burning
     */
    function _calculateBurnFee(uint256 amount) internal pure returns (uint256) {
        return (amount * BURN_FEE_BASIS_POINTS) / BASIS_POINTS_DENOMINATOR;
    }

    /**
     * @notice Allows users to participate by sending tokens to the escrow
     * @param amount Amount of tokens to send
     * @param challengeId ID of the challenge
     * @param playerId Optional ID of the player
     * @param participationType Type of participation (SideBet or JoinChallenge)
     * @param isNative Whether the token is native BNB
     * @param tokenAddress Address of the token (ignored if isNative is true)
     * @param _odds Odds for this particular bet 
     */
    function participate(
        uint256 amount,
        uint256 challengeId,
        uint256 playerId,
        ParticipationType participationType,
        bool isNative,
        address tokenAddress, 
        uint256 _odds
    ) external payable nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }
        
        // NEW: Validate odds
        if (_odds == 0) {
            revert InvalidOdds();
        }
        
        address effectiveTokenAddress = isNative ? address(0) : tokenAddress;
        
        if (!whitelistedTokens[effectiveTokenAddress]) {
            revert UnsupportedCurrency(effectiveTokenAddress);
        }

        // NEW: Store user odds for this challenge and player
        userOdds[msg.sender][challengeId][playerId] = _odds;

        if (isNative) {
            uint256 burnFee = _calculateBurnFee(amount);
            uint256 totalRequired = amount + burnFee;
            
            if (msg.value != totalRequired) {
                revert InvalidAmount();
            }
            
            bnbBalance += amount;
            bnbLiabilities += amount;
            userDeposits[msg.sender][address(0)] += amount;
            
            // Collect burn fee
            accumulatedBurnFees += burnFee;
            emit BurnFeesCollected(burnFee);
        } else {
            IERC20 token = IERC20(tokenAddress);
            
            // SafeERC20 handles the transfer and reverts on failure
            token.safeTransferFrom(msg.sender, address(this), amount);
            
            tokenBalances[tokenAddress] += amount;
            userDeposits[msg.sender][tokenAddress] += amount;
        }

        uint256 currentNonce = userNonces[msg.sender]++;
        
        emit ParticipateEvent(
            msg.sender,
            effectiveTokenAddress,
            amount,
            challengeId,
            playerId,
            participationType,
            isNative,
            currentNonce,
            _odds // NEW: Include odds in event
        );
    }

    /**
     * @notice Participate with EIP-712 signature (for gasless transactions)
     * @param user The user participating
     * @param amount Amount of tokens to send
     * @param challengeId ID of the challenge
     * @param playerId Optional ID of the player
     * @param participationType Type of participation
     * @param isNative Whether the token is native BNB
     * @param tokenAddress Address of the token
     * @param nonce User's nonce for this signature
     * @param signature EIP-712 signature
     * @param _odds Odds for this particular bet
     */
    function participateWithSignature(
        address user,
        uint256 amount,
        uint256 challengeId,
        uint256 playerId,
        ParticipationType participationType,
        bool isNative,
        address tokenAddress,
        uint256 nonce,
        bytes calldata signature,
        uint256 _odds
    ) external payable nonReentrant {
        _verifySignature(user, amount, challengeId, playerId, participationType, isNative, tokenAddress, nonce, signature);
        _executeParticipation(user, amount, challengeId, playerId, participationType, isNative, tokenAddress, nonce, _odds);
    }

    /**
     * @notice Internal function to verify EIP-712 signature
     */
    function _verifySignature(
        address user,
        uint256 amount,
        uint256 challengeId,
        uint256 playerId,
        ParticipationType participationType,
        bool isNative,
        address tokenAddress,
        uint256 nonce,
        bytes calldata signature
    ) internal view {
        if (nonce != userNonces[user]) {
            revert InvalidSignature();
        }

        bytes32 structHash = keccak256(abi.encode(
            PARTICIPATE_TYPEHASH,
            user,
            amount,
            challengeId,
            playerId,
            participationType,
            isNative,
            tokenAddress,
            nonce
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        
        if (signer != user) {
            revert InvalidSignature();
        }
    }

    /**
     * @notice Internal function to execute participation logic
     */
    function _executeParticipation(
        address user,
        uint256 amount,
        uint256 challengeId,
        uint256 playerId,
        ParticipationType participationType,
        bool isNative,
        address tokenAddress,
        uint256 nonce,
        uint256 _odds
    ) internal {
        if (amount == 0) {
            revert InvalidAmount();
        }
        
        // NEW: Validate odds
        if (_odds == 0) {
            revert InvalidOdds();
        }

        address effectiveTokenAddress = isNative ? address(0) : tokenAddress;
        
        if (!whitelistedTokens[effectiveTokenAddress]) {
            revert UnsupportedCurrency(effectiveTokenAddress);
        }

        // NEW: Store user odds
        userOdds[user][challengeId][playerId] = _odds;

        if (isNative) {
            uint256 burnFee = _calculateBurnFee(amount);
            uint256 totalRequired = amount + burnFee;
            
            if (msg.value != totalRequired) {
                revert InvalidAmount();
            }
            
            bnbBalance += amount;
            bnbLiabilities += amount;
            userDeposits[user][address(0)] += amount;
            
            // Collect burn fee
            accumulatedBurnFees += burnFee;
            emit BurnFeesCollected(burnFee);
        } else {
            IERC20(tokenAddress).safeTransferFrom(user, address(this), amount);
            tokenBalances[tokenAddress] += amount;
            userDeposits[user][tokenAddress] += amount;
        }

        userNonces[user]++;
        
        emit ParticipateEvent(
            user,
            effectiveTokenAddress,
            amount,
            challengeId,
            playerId,
            participationType,
            isNative,
            nonce,
            _odds
        );
    }

    /**
     * @notice Handles false settlements by transferring tokens back to users
     * @param amount Amount to transfer
     * @param txnId Transaction ID for reference
     * @param isNative Whether it's native BNB
     * @param user User address to refund
     * @param tokenAddress Address of the token being refunded
     */
    function falseSettlement(
        uint256 amount,
        string calldata txnId,
        bool isNative,
        address payable user,
        address tokenAddress
    ) external onlyOwner nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        address effectiveTokenAddress = isNative ? address(0) : tokenAddress;

        if (isNative) {
            if (bnbLiabilities < amount) {
                revert InsufficientFunds(address(0), amount, bnbLiabilities);
            }
            
            bnbBalance -= amount;
            bnbLiabilities -= amount;
            userDeposits[user][address(0)] -= amount;
            
            (bool success, ) = user.call{value: amount}("");
            if (!success) {
                revert TransferFailed(address(0), user, amount);
            }
        } else {
            if (tokenBalances[tokenAddress] < amount) {
                revert InsufficientFunds(tokenAddress, amount, tokenBalances[tokenAddress]);
            }
            
            tokenBalances[tokenAddress] -= amount;
            userDeposits[user][tokenAddress] -= amount;
            
            IERC20 token = IERC20(tokenAddress);
            token.safeTransfer(user, amount);
        }

        emit FalseSettlementEvent(
            user,
            effectiveTokenAddress,
            amount,
            txnId,
            isNative
        );
    }

    /**
     * @notice Sends tokens from the escrow to an admin account
     * @param amount Amount to transfer
     * @param isNative Whether it's native BNB
     * @param adminAccount Address of the admin
     * @param tokenAddress Address of the token being sent
     */
    function send(
        uint256 amount,
        bool isNative,
        address payable adminAccount,
        address tokenAddress
    ) external onlyOwner nonReentrant {
        if (amount == 0) {
            revert InvalidAmount();
        }

        address effectiveTokenAddress = isNative ? address(0) : tokenAddress;

        if (isNative) {
            if (bnbBalance < amount) {
                revert InsufficientFunds(address(0), amount, bnbBalance);
            }
            
            bnbBalance -= amount;
            (bool success, ) = adminAccount.call{value: amount}("");
            if (!success) {
                revert TransferFailed(address(0), adminAccount, amount);
            }
        } else {
            if (tokenBalances[tokenAddress] < amount) {
                revert InsufficientFunds(tokenAddress, amount, tokenBalances[tokenAddress]);
            }
            
            tokenBalances[tokenAddress] -= amount;
            IERC20 token = IERC20(tokenAddress);
            token.safeTransfer(adminAccount, amount);
        }

        emit SendEvent(
            adminAccount,
            effectiveTokenAddress,
            amount,
            isNative
        );
    }

    /**
     * @notice Settles a challenge by distributing tokens to winners based on their stored odds
     * @param betAmounts Array of original bet amounts for each winner
     * @param challengeId ID of the challenge
     * @param isNative Whether it's native BNB
     * @param winners Array of winner addresses
     * @param tokenAddress Address of the token being distributed
     * @param playerIds Array of player IDs corresponding to each winner's bet
     */
    function settleChallenge(
        uint256[] calldata betAmounts,
        uint256 challengeId,
        bool isNative,
        address payable[] calldata winners,
        address tokenAddress,
        uint256[] calldata playerIds // NEW: Added to identify which bet to use for odds
    ) external onlyOwner nonReentrant {
        if (winners.length != betAmounts.length || winners.length != playerIds.length) {
            revert InvalidInput();
        }
        
        if (winners.length > MAX_BATCH_SIZE) {
            revert BatchSizeExceeded(winners.length, MAX_BATCH_SIZE);
        }

        // NEW: Calculate payout amounts using stored odds
        uint256[] memory payoutAmounts = new uint256[](winners.length);
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < winners.length; i++) {
            if (betAmounts[i] == 0) {
                revert InvalidAmount();
            }
            
            // NEW: Get stored odds for this user, challenge, and player
            uint256 odds = userOdds[winners[i]][challengeId][playerIds[i]];
            if (odds == 0) {
                revert InvalidOdds();
            }
            
            // NEW: Calculate payout = betAmount * odds / 1000 (assuming odds scaled by 1000)
            payoutAmounts[i] = (betAmounts[i] * odds) / 1000;
            totalAmount += payoutAmounts[i];
        }

        address effectiveTokenAddress = isNative ? address(0) : tokenAddress;

        if (isNative) {
            if (bnbLiabilities < totalAmount) {
                revert InsufficientFunds(address(0), totalAmount, bnbLiabilities);
            }
            bnbBalance -= totalAmount;
            bnbLiabilities -= totalAmount;

            // Use try-catch to handle failed transfers without reverting the entire batch
            uint256 successfulTransfers = 0;
            for (uint256 i = 0; i < winners.length; i++) {
                (bool success, ) = winners[i].call{value: payoutAmounts[i]}("");
                if (success) {
                    successfulTransfers++;
                } else {
                    // Log failed transfer but don't revert
                    emit TransferFailedEvent(address(0), winners[i], payoutAmounts[i]);
                    // Refund the failed amount back to balances
                    bnbBalance += payoutAmounts[i];
                    bnbLiabilities += payoutAmounts[i];
                }
            }
        } else {
            if (tokenBalances[tokenAddress] < totalAmount) {
                revert InsufficientFunds(tokenAddress, totalAmount, tokenBalances[tokenAddress]);
            }
            
            tokenBalances[tokenAddress] -= totalAmount;
            IERC20 token = IERC20(tokenAddress);

            uint256 successfulTransfers = 0;
            for (uint256 i = 0; i < winners.length; i++) {
                try token.transfer(winners[i], payoutAmounts[i]) returns (bool success) {
                    if (success) {
                        successfulTransfers++;
                    } else {
                        // Refund failed transfer
                        tokenBalances[tokenAddress] += payoutAmounts[i];
                    }
                } catch {
                    // Refund failed transfer
                    tokenBalances[tokenAddress] += payoutAmounts[i];
                }
            }
        }

        // Convert address payable[] to address[] for the event
        address[] memory winnerAddresses = new address[](winners.length);
        for (uint256 i = 0; i < winners.length; i++) {
            winnerAddresses[i] = winners[i];
        }

        // NEW: Emit event with calculated payout amounts instead of original bet amounts
        emit SettleChallengeEvent(
            effectiveTokenAddress,
            payoutAmounts, // NEW: Shows actual payouts based on odds
            challengeId,
            winnerAddresses,
            isNative
        );
    }

    /**
     * @notice Burns accumulated BNB fees (BEP-95 Integration)
     */
    function burnAccumulatedFees() external onlyOwner nonReentrant {
        if (accumulatedBurnFees == 0) {
            revert InvalidAmount();
        }
        
        uint256 burnAmount = accumulatedBurnFees;
        accumulatedBurnFees = 0;
        totalBurnedAmount += burnAmount;
        
        // Send BNB to burn address (0xdEaD)
        (bool success, ) = BURN_ADDRESS.call{value: burnAmount}("");
        if (!success) {
            revert TransferFailed(address(0), BURN_ADDRESS, burnAmount);
        }
        
        emit BnbBurned(burnAmount);
    }

    /**
     * @notice Removes a token from the whitelist (only if balance is zero)
     * @param tokenToRemove Address of the token to remove
     */
    function removeToken(address tokenToRemove) external onlyOwner {
        if (!whitelistedTokens[tokenToRemove]) {
            revert TokenNotFound(tokenToRemove);
        }
        
        if (tokenBalances[tokenToRemove] > 0) {
            revert TokenHasBalance(tokenToRemove, tokenBalances[tokenToRemove]);
        }
        
        whitelistedTokens[tokenToRemove] = false;
        
        // Remove from supportedTokens array
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == tokenToRemove) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }

        emit TokenRemoved(tokenToRemove);
    }

    /**
     * @notice Returns the number of different tokens supported by the contract
     */
    function getSupportedTokenCount() external view returns (uint256) {
        return supportedTokens.length;
    }

    /**
     * @notice Get supported token by index
     */
    function getSupportedToken(uint256 index) external view returns (address) {
        return supportedTokens[index];
    }

    /**
     * @notice Get user's deposit amount for a specific token
     */
    function getUserDeposit(address user, address token) external view returns (uint256) {
        return userDeposits[user][token];
    }

    /**
     * @notice NEW: Get user's odds for a specific challenge and player
     * @param user User address
     * @param challengeId Challenge ID
     * @param playerId Player ID
     * @return odds The odds for this bet
     */
    function getUserOdds(address user, uint256 challengeId, uint256 playerId) external view returns (uint256) {
        return userOdds[user][challengeId][playerId];
    }

    /**
     * @notice Get burn fee information
     */
    function getBurnFeeInfo() external view returns (uint256 feeRate, uint256 accumulated, uint256 totalBurned) {
        return (BURN_FEE_BASIS_POINTS, accumulatedBurnFees, totalBurnedAmount);
    }

    /**
     * @notice Detect and handle forced BNB (e.g., from selfdestruct)
     */
    function handleForcedBnb() external onlyOwner {
        uint256 actualBalance = address(this).balance;
        uint256 totalAccountedBalance = bnbBalance + accumulatedBurnFees;
        
        if (actualBalance > totalAccountedBalance) {
            uint256 forcedAmount = actualBalance - totalAccountedBalance;
            bnbBalance += forcedAmount;
            emit ForcedBnbDetected(forcedAmount);
        }
    }

    /**
     * @notice Emergency function to withdraw forced BNB
     */
    function withdrawForcedBnb() external onlyOwner {
        uint256 forcedAmount = bnbBalance - bnbLiabilities;
        if (forcedAmount > 0) {
            bnbBalance -= forcedAmount;
            (bool success, ) = payable(owner()).call{value: forcedAmount}("");
            if (!success) {
                revert TransferFailed(address(0), owner(), forcedAmount);
            }
        }
    }

    /**
     * @notice Rejects direct BNB transfers
     */
    receive() external payable {
        revert DirectBnbNotAllowed();
    }

    /**
     * @notice Fallback function also rejects BNB
     */
    fallback() external payable {
        revert DirectBnbNotAllowed();
    }
}