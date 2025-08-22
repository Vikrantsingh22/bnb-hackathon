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

    // NEW: Individual bet structure
    struct Bet {
        address user;
        uint256 amount;
        uint256 odds;
        address tokenAddress;
        bool isNative;
        bool settled; // Track if this bet has been settled
    }

    // Main state variables
    mapping(address => uint256) public tokenBalances;
    mapping(address => mapping(address => uint256)) public userDeposits; // user => token => amount
    mapping(address => bool) public whitelistedTokens;
    
    // NEW: Track individual bets
    mapping(uint256 => mapping(uint256 => Bet[])) public challengeBets; // challengeId => playerId => array of bets
    uint256 public nextBetId; // Global bet counter
    mapping(uint256 => Bet) public betDetails; // betId => Bet details
    
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
        uint256 odds,
        uint256 betId // NEW: Include bet ID
    );

    event SettleChallengeEvent(
        address indexed token,
        uint256[] betIds, // NEW: Track which specific bets were settled
        uint256[] payoutAmounts,
        uint256 challengeId,
        uint256 playerId,
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
    error InvalidOdds();
    error BetNotFound(uint256 betId);
    error BetAlreadySettled(uint256 betId);

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
     * @return betId The unique ID assigned to this bet
     */
    function participate(
        uint256 amount,
        uint256 challengeId,
        uint256 playerId,
        ParticipationType participationType,
        bool isNative,
        address tokenAddress, 
        uint256 _odds
    ) external payable nonReentrant returns (uint256 betId) {
        if (amount == 0) {
            revert InvalidAmount();
        }
        
        if (_odds == 0) {
            revert InvalidOdds();
        }
        
        address effectiveTokenAddress = isNative ? address(0) : tokenAddress;
        
        if (!whitelistedTokens[effectiveTokenAddress]) {
            revert UnsupportedCurrency(effectiveTokenAddress);
        }

        // NEW: Create unique bet ID
        betId = nextBetId++;

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
            token.safeTransferFrom(msg.sender, address(this), amount);
            
            tokenBalances[tokenAddress] += amount;
            userDeposits[msg.sender][tokenAddress] += amount;
        }

        // NEW: Store individual bet details
        Bet memory newBet = Bet({
            user: msg.sender,
            amount: amount,
            odds: _odds,
            tokenAddress: effectiveTokenAddress,
            isNative: isNative,
            settled: false
        });

        // Store in both mappings for easy access
        challengeBets[challengeId][playerId].push(newBet);
        betDetails[betId] = newBet;

        emit ParticipateEvent(
            msg.sender,
            effectiveTokenAddress,
            amount,
            challengeId,
            playerId,
            participationType,
            isNative,
            _odds,
            betId
        );
        
        return betId;
    }

    /**
     * @notice NEW: Settle specific bets by their IDs (most precise method)
     * @param betIds Array of bet IDs to settle as winners
     */
    function settleBetsByIds(
        uint256[] calldata betIds
    ) external onlyOwner nonReentrant {
        if (betIds.length > MAX_BATCH_SIZE) {
            revert BatchSizeExceeded(betIds.length, MAX_BATCH_SIZE);
        }

        uint256[] memory payoutAmounts = new uint256[](betIds.length);
        uint256 totalBnbPayout = 0;
        uint256 totalTokenPayout = 0;
        address tokenAddress = address(0);
        bool isNative = true;

        // First pass: validate bets and calculate payouts
        for (uint256 i = 0; i < betIds.length; i++) {
            Bet storage bet = betDetails[betIds[i]];
            
            if (bet.user == address(0)) {
                revert BetNotFound(betIds[i]);
            }
            
            if (bet.settled) {
                revert BetAlreadySettled(betIds[i]);
            }

            // Calculate payout: betAmount * odds / 1000 (assuming odds scaled by 1000)
            payoutAmounts[i] = (bet.amount * bet.odds) / 1000;
            
            if (bet.isNative) {
                totalBnbPayout += payoutAmounts[i];
            } else {
                totalTokenPayout += payoutAmounts[i];
                tokenAddress = bet.tokenAddress; // All token bets should be same token
            }

            // Mark as settled
            bet.settled = true;
        }

        // Second pass: execute payouts
        for (uint256 i = 0; i < betIds.length; i++) {
            Bet storage bet = betDetails[betIds[i]];
            
            if (bet.isNative) {
                if (bnbLiabilities < payoutAmounts[i]) {
                    revert InsufficientFunds(address(0), payoutAmounts[i], bnbLiabilities);
                }
                
                bnbBalance -= payoutAmounts[i];
                bnbLiabilities -= payoutAmounts[i];
                
                (bool success, ) = payable(bet.user).call{value: payoutAmounts[i]}("");
                if (!success) {
                    emit TransferFailedEvent(address(0), bet.user, payoutAmounts[i]);
                    // Refund to balances
                    bnbBalance += payoutAmounts[i];
                    bnbLiabilities += payoutAmounts[i];
                    bet.settled = false; // Mark as unsettled
                }
            } else {
                if (tokenBalances[bet.tokenAddress] < payoutAmounts[i]) {
                    revert InsufficientFunds(bet.tokenAddress, payoutAmounts[i], tokenBalances[bet.tokenAddress]);
                }
                
                tokenBalances[bet.tokenAddress] -= payoutAmounts[i];
                IERC20 token = IERC20(bet.tokenAddress);
                
                try token.transfer(bet.user, payoutAmounts[i]) returns (bool success) {
                    if (!success) {
                        tokenBalances[bet.tokenAddress] += payoutAmounts[i];
                        bet.settled = false;
                    }
                } catch {
                    tokenBalances[bet.tokenAddress] += payoutAmounts[i];
                    bet.settled = false;
                }
            }
        }

        // Emit settlement event
        emit SettleChallengeEvent(
            tokenAddress,
            betIds,
            payoutAmounts,
            0, // challengeId not specified in this method
            0, // playerId not specified in this method  
            isNative
        );
    }

    /**
     * @notice NEW: Settle all winning bets for a specific challenge and player
     * @param challengeId ID of the challenge
     * @param playerId ID of the winning player
     */
    function settleChallengePlayer(
        uint256 challengeId,
        uint256 playerId
    ) external onlyOwner nonReentrant {
        Bet[] storage bets = challengeBets[challengeId][playerId];
        
        if (bets.length == 0) {
            revert InvalidInput();
        }

        uint256[] memory betIds = new uint256[](bets.length);
        uint256[] memory payoutAmounts = new uint256[](bets.length);
        uint256 totalBnbPayout = 0;
        uint256 totalTokenPayout = 0;
        address tokenAddress = address(0);
        bool hasNative = false;

        // Calculate payouts and collect bet IDs
        for (uint256 i = 0; i < bets.length; i++) {
            if (bets[i].settled) {
                continue; // Skip already settled bets
            }

            betIds[i] = i; // This is the index, you might want to store actual bet IDs
            payoutAmounts[i] = (bets[i].amount * bets[i].odds) / 1000;
            
            if (bets[i].isNative) {
                totalBnbPayout += payoutAmounts[i];
                hasNative = true;
            } else {
                totalTokenPayout += payoutAmounts[i];
                tokenAddress = bets[i].tokenAddress;
            }

            bets[i].settled = true;
        }

        // Execute payouts
        for (uint256 i = 0; i < bets.length; i++) {
            if (payoutAmounts[i] == 0) continue; // Skip if already settled

            if (bets[i].isNative) {
                bnbBalance -= payoutAmounts[i];
                bnbLiabilities -= payoutAmounts[i];
                
                (bool success, ) = payable(bets[i].user).call{value: payoutAmounts[i]}("");
                if (!success) {
                    emit TransferFailedEvent(address(0), bets[i].user, payoutAmounts[i]);
                    bnbBalance += payoutAmounts[i];
                    bnbLiabilities += payoutAmounts[i];
                }
            } else {
                tokenBalances[bets[i].tokenAddress] -= payoutAmounts[i];
                IERC20(bets[i].tokenAddress).safeTransfer(bets[i].user, payoutAmounts[i]);
            }
        }

        emit SettleChallengeEvent(
            hasNative ? address(0) : tokenAddress,
            betIds,
            payoutAmounts,
            challengeId,
            playerId,
            hasNative
        );
    }

    /**
     * @notice NEW: Get all bets for a specific challenge and player
     * @param challengeId Challenge ID
     * @param playerId Player ID
     * @return bets Array of all bets for this challenge/player combo
     */
    function getChallengeBets(uint256 challengeId, uint256 playerId) 
        external view returns (Bet[] memory bets) {
        return challengeBets[challengeId][playerId];
    }

    /**
     * @notice NEW: Get bet details by bet ID
     * @param betId The bet ID
     * @return bet The bet details
     */
    function getBetDetails(uint256 betId) external view returns (Bet memory bet) {
        return betDetails[betId];
    }

    /**
     * @notice NEW: Get total number of bets for a challenge/player
     * @param challengeId Challenge ID
     * @param playerId Player ID
     * @return count Number of bets
     */
    function getBetCount(uint256 challengeId, uint256 playerId) external view returns (uint256 count) {
        return challengeBets[challengeId][playerId].length;
    }

    // [REST OF THE ORIGINAL FUNCTIONS REMAIN THE SAME]
    
    /**
     * @notice Handles false settlements by transferring tokens back to users
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
     * @notice Burns accumulated BNB fees (BEP-95 Integration)
     */
    function burnAccumulatedFees() external onlyOwner nonReentrant {
        if (accumulatedBurnFees == 0) {
            revert InvalidAmount();
        }
        
        uint256 burnAmount = accumulatedBurnFees;
        accumulatedBurnFees = 0;
        totalBurnedAmount += burnAmount;
        
        (bool success, ) = BURN_ADDRESS.call{value: burnAmount}("");
        if (!success) {
            revert TransferFailed(address(0), BURN_ADDRESS, burnAmount);
        }
        
        emit BnbBurned(burnAmount);
    }

    /**
     * @notice Removes a token from the whitelist (only if balance is zero)
     */
    function removeToken(address tokenToRemove) external onlyOwner {
        if (!whitelistedTokens[tokenToRemove]) {
            revert TokenNotFound(tokenToRemove);
        }
        
        if (tokenBalances[tokenToRemove] > 0) {
            revert TokenHasBalance(tokenToRemove, tokenBalances[tokenToRemove]);
        }
        
        whitelistedTokens[tokenToRemove] = false;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == tokenToRemove) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }

        emit TokenRemoved(tokenToRemove);
    }

    function getSupportedTokenCount() external view returns (uint256) {
        return supportedTokens.length;
    }

    function getSupportedToken(uint256 index) external view returns (address) {
        return supportedTokens[index];
    }

    function getUserDeposit(address user, address token) external view returns (uint256) {
        return userDeposits[user][token];
    }

    function getBurnFeeInfo() external view returns (uint256 feeRate, uint256 accumulated, uint256 totalBurned) {
        return (BURN_FEE_BASIS_POINTS, accumulatedBurnFees, totalBurnedAmount);
    }

    function handleForcedBnb() external onlyOwner {
        uint256 actualBalance = address(this).balance;
        uint256 totalAccountedBalance = bnbBalance + accumulatedBurnFees;
        
        if (actualBalance > totalAccountedBalance) {
            uint256 forcedAmount = actualBalance - totalAccountedBalance;
            bnbBalance += forcedAmount;
            emit ForcedBnbDetected(forcedAmount);
        }
    }

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

    receive() external payable {
        revert DirectBnbNotAllowed();
    }

    fallback() external payable {
        revert DirectBnbNotAllowed();
    }
}
