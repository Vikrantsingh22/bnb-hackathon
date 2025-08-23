// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MultiTokenEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    enum ParticipationType { SideBet, JoinChallenge }

    struct Bet {
        address user;
        uint256 amount;
        uint256 odds;
        address tokenAddress;
        bool isNative;
        bool settled;
    }

    // Core state variables
    mapping(address => uint256) public tokenBalances;
    mapping(address => bool) public whitelistedTokens;
    
    // Track individual bets
    mapping(uint256 => mapping(uint256 => Bet[])) public challengeBets; // challengeId => playerId => bets
    uint256 public nextBetId;
    mapping(uint256 => Bet) public betDetails; // betId => Bet details
    
    uint256 public bnbBalance;
    uint256 public bnbLiabilities;
    
    // WBNB contract address on BNB Smart Chain 
    address public constant WBNB = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    
    // Batch settlement limit
    uint256 public constant MAX_BATCH_SIZE = 50;

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
        uint256 betId
    );

    event SettleChallengeEvent(
        address indexed token,
        uint256[] betIds,
        uint256[] payoutAmounts,
        uint256 challengeId,
        uint256 playerId,
        bool isNative
    );

    event TokenWhitelisted(address indexed token);
    event TransferFailedEvent(address indexed token, address indexed to, uint256 amount);
    event DebugEvent(string message, uint256 value);

    constructor() Ownable(msg.sender) {
        // Native BNB is implicitly supported
        whitelistedTokens[address(0)] = true;
        
        // Auto-whitelist WBNB
        whitelistedTokens[WBNB] = true;
    }

    /**
     * @notice Whitelist a token for use in the escrow
     */
    function whitelistToken(address tokenAddress) external onlyOwner {
        require(!whitelistedTokens[tokenAddress], "Token already whitelisted");
        
        whitelistedTokens[tokenAddress] = true;
        emit TokenWhitelisted(tokenAddress);
    }

    /**
     * @notice Simple participate function with basic validation
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
        
        emit DebugEvent("Function called", 1);
        
        // Basic validation
        require(_odds > 0, "Invalid odds");
        require(challengeId > 0, "Invalid challenge ID");
        require(playerId > 0, "Invalid player ID");

        emit DebugEvent("Basic validation passed", 2);

        address effectiveTokenAddress = isNative ? address(0) : tokenAddress;
        require(whitelistedTokens[effectiveTokenAddress], "Token not whitelisted");

        emit DebugEvent("Token validation passed", 3);

        // Create unique bet ID
        betId = nextBetId;
        nextBetId++;

        emit DebugEvent("Bet ID created", betId);

        if (isNative) {
            require(msg.value > 0, "Must send BNB");
            amount = msg.value; // Use the actual BNB sent

            bnbBalance += amount;
            bnbLiabilities += amount;
            
            emit DebugEvent("BNB processed", amount);
        } else {
            require(msg.value == 0, "Should not send BNB for token bet");
            require(amount > 0, "Invalid token amount");
            
            IERC20 token = IERC20(tokenAddress);
            token.safeTransferFrom(msg.sender, address(this), amount);
            tokenBalances[tokenAddress] += amount;
            
            emit DebugEvent("Token processed", amount);
        }

        // Store individual bet details
        Bet memory newBet = Bet({
            user: msg.sender,
            amount: amount,
            odds: _odds,
            tokenAddress: effectiveTokenAddress,
            isNative: isNative,
            settled: false
        });

        challengeBets[challengeId][playerId].push(newBet);
        betDetails[betId] = newBet;

        emit DebugEvent("Bet stored", 4);

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
     * @notice Settle all winning bets for a specific challenge and player
     */
    function settleChallengePlayer(
        uint256 challengeId,
        uint256 playerId
    ) external onlyOwner nonReentrant {
        Bet[] storage bets = challengeBets[challengeId][playerId];
        uint256 len = bets.length;
        require(len > 0, "No bets found");

        uint256[] memory betIds = new uint256[](len);
        uint256[] memory payoutAmounts = new uint256[](len);
        bool hasNative = false;
        address tokenAddress = address(0);

        for (uint256 i = 0; i < len; i++) {
            Bet storage b = bets[i];

            if (!b.settled) {
                betIds[i] = i;

                uint256 payout = (b.amount * b.odds) / 1000;
                payoutAmounts[i] = payout;

                b.settled = true;

                if (b.isNative) {
                    hasNative = true;
                    require(bnbLiabilities >= payout, "Insufficient BNB");

                    bnbBalance -= payout;
                    bnbLiabilities -= payout;

                    (bool success, ) = payable(b.user).call{value: payout}("");
                    if (!success) {
                        emit TransferFailedEvent(address(0), b.user, payout);
                        bnbBalance += payout;
                        bnbLiabilities += payout;
                        b.settled = false;
                    }
                } else {
                    tokenAddress = b.tokenAddress;
                    require(tokenBalances[tokenAddress] >= payout, "Insufficient tokens");

                    tokenBalances[tokenAddress] -= payout;
                    IERC20(tokenAddress).safeTransfer(b.user, payout);
                }
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
     * @notice Get all bets for a specific challenge and player
     */
    function getChallengeBets(uint256 challengeId, uint256 playerId) 
        external view returns (Bet[] memory bets) {
        return challengeBets[challengeId][playerId];
    }

    /**
     * @notice Get bet details by bet ID
     */
    function getBetDetails(uint256 betId) external view returns (Bet memory bet) {
        return betDetails[betId];
    }

    /**
     * @notice Get total number of bets for a challenge/player
     */
    function getBetCount(uint256 challengeId, uint256 playerId) external view returns (uint256 count) {
        return challengeBets[challengeId][playerId].length;
    }

    // Check if token is whitelisted
    function isTokenWhitelisted(address token) external view returns (bool) {
        return whitelistedTokens[token];
    }

    // Prevent direct BNB transfers
    receive() external payable {
        revert("Direct BNB not allowed");
    }

    fallback() external payable {
        revert("Direct BNB not allowed");
    }
}
