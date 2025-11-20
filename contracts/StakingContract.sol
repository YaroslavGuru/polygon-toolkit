// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title StakingContract
 * @dev Production-grade staking contract that allows users to stake tokens and earn rewards
 * @notice Supports flexible reward rates, optional lock periods, and secure withdrawal mechanisms
 * 
 * Features:
 * - Stake tokens to earn rewards
 * - Withdraw staked tokens
 * - Claim accumulated rewards
 * - Configurable reward rate (APR)
 * - Optional lock period
 * - Reentrancy protection
 * - Safe token transfers
 */
contract StakingContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Precision for reward calculations (1e18 = 100%)
    uint256 private constant PRECISION = 1e18;
    
    /// @dev Seconds in a year for APR calculations
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    /// @dev The ERC20 token being staked
    IERC20 public immutable stakingToken;
    
    /// @dev The ERC20 token used for rewards (can be same as stakingToken)
    IERC20 public immutable rewardToken;
    
    /// @dev Annual reward rate (APR) in basis points (1e18 = 100%)
    uint256 public rewardRate; // e.g., 0.1e18 = 10% APR
    
    /// @dev Minimum lock period in seconds (0 = no lock)
    uint256 public lockPeriod;
    
    /// @dev Total amount of tokens staked
    uint256 public totalStaked;
    
    /// @dev Total rewards distributed
    uint256 public totalRewardsDistributed;

    /// @dev Stake data for each user
    struct StakeData {
        uint256 amount;           // Amount of tokens staked
        uint256 rewardDebt;       // Reward debt for accurate accounting
        uint256 lastUpdateTime;   // Last time rewards were calculated
        uint256 lockUntil;         // Timestamp until which tokens are locked (0 = no lock)
    }

    /// @dev Mapping of user address to their stake data
    mapping(address => StakeData) public stakes;

    /// @dev Event emitted when tokens are staked
    event Staked(address indexed user, uint256 amount, uint256 lockUntil);
    
    /// @dev Event emitted when tokens are withdrawn
    event Withdrawn(address indexed user, uint256 amount);
    
    /// @dev Event emitted when rewards are claimed
    event RewardClaimed(address indexed user, uint256 reward);
    
    /// @dev Event emitted when reward rate is updated
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    
    /// @dev Event emitted when lock period is updated
    event LockPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    /// @dev Custom error for insufficient balance
    error InsufficientBalance();
    
    /// @dev Custom error for tokens still locked
    error TokensLocked(uint256 lockUntil);
    
    /// @dev Custom error for invalid reward rate
    error InvalidRewardRate();
    
    /// @dev Custom error for invalid lock period
    error InvalidLockPeriod();
    
    /// @dev Custom error for zero amount
    error ZeroAmount();

    /**
     * @dev Constructor
     * @param _stakingToken Address of the token to be staked
     * @param _rewardToken Address of the reward token (can be same as stakingToken)
     * @param _rewardRate Initial reward rate (APR) in wei (1e18 = 100%)
     * @param _lockPeriod Lock period in seconds (0 = no lock)
     */
    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _lockPeriod
    ) Ownable() {
        require(_stakingToken != address(0), "StakingContract: invalid staking token");
        require(_rewardToken != address(0), "StakingContract: invalid reward token");
        
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        lockPeriod = _lockPeriod;
    }

    /**
     * @dev Stake tokens to earn rewards
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        StakeData storage userStake = stakes[msg.sender];
        
        // Update rewards before adding new stake
        _updateRewards(msg.sender);
        
        // Transfer tokens from user
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update stake data
        userStake.amount += amount;
        userStake.lastUpdateTime = block.timestamp;
        
        // Set lock period if applicable
        if (lockPeriod > 0) {
            uint256 newLockUntil = block.timestamp + lockPeriod;
            // If user already has a lock, extend it if new lock is later
            if (newLockUntil > userStake.lockUntil) {
                userStake.lockUntil = newLockUntil;
            }
        }
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, userStake.lockUntil);
    }

    /**
     * @dev Withdraw staked tokens
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        StakeData storage userStake = stakes[msg.sender];
        
        if (userStake.amount < amount) revert InsufficientBalance();
        
        // Check if tokens are locked
        if (userStake.lockUntil > 0 && block.timestamp < userStake.lockUntil) {
            revert TokensLocked(userStake.lockUntil);
        }
        
        // Update rewards before withdrawal
        _updateRewards(msg.sender);
        
        // Update stake data
        userStake.amount -= amount;
        totalStaked -= amount;
        
        // Transfer tokens to user
        stakingToken.safeTransfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        StakeData storage userStake = stakes[msg.sender];
        
        if (userStake.amount == 0) {
            return;
        }
        
        uint256 pendingReward = _calculatePendingReward(msg.sender);
        
        if (pendingReward > 0) {
            // Update reward debt and timestamp
            userStake.rewardDebt = _calculateRewardDebt(msg.sender);
            userStake.lastUpdateTime = block.timestamp;
            
            totalRewardsDistributed += pendingReward;
            
            // Transfer rewards
            rewardToken.safeTransfer(msg.sender, pendingReward);
            
            emit RewardClaimed(msg.sender, pendingReward);
        }
    }

    /**
     * @dev Get pending rewards for a user
     * @param user Address of the user
     * @return Pending reward amount
     */
    function getPendingReward(address user) external view returns (uint256) {
        return _calculatePendingReward(user);
    }

    /**
     * @dev Get total staked amount for a user
     * @param user Address of the user
     * @return Total staked amount
     */
    function getUserStake(address user) external view returns (uint256) {
        return stakes[user].amount;
    }

    /**
     * @dev Get lock information for a user
     * @param user Address of the user
     * @return lockUntil Timestamp until which tokens are locked (0 = no lock)
     * @return isLocked Whether tokens are currently locked
     */
    function getUserLockInfo(address user) external view returns (uint256 lockUntil, bool isLocked) {
        lockUntil = stakes[user].lockUntil;
        isLocked = lockUntil > 0 && block.timestamp < lockUntil;
    }

    /**
     * @dev Update reward rate (owner only)
     * @param newRate New reward rate (APR) in wei (1e18 = 100%)
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        if (newRate > PRECISION) revert InvalidRewardRate();
        
        uint256 oldRate = rewardRate;
        rewardRate = newRate;
        
        emit RewardRateUpdated(oldRate, newRate);
    }

    /**
     * @dev Update lock period (owner only)
     * @param newPeriod New lock period in seconds (0 = no lock)
     */
    function setLockPeriod(uint256 newPeriod) external onlyOwner {
        lockPeriod = newPeriod;
        
        emit LockPeriodUpdated(lockPeriod, newPeriod);
    }

    /**
     * @dev Emergency withdraw rewards (owner only)
     * @param amount Amount of reward tokens to withdraw
     */
    function emergencyWithdrawRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransfer(owner(), amount);
    }

    /**
     * @dev Internal function to update user rewards
     * @param user Address of the user
     */
    function _updateRewards(address user) internal {
        StakeData storage userStake = stakes[user];
        
        if (userStake.amount > 0) {
            // Update reward debt and timestamp for accurate accounting
            userStake.rewardDebt = _calculateRewardDebt(user);
            userStake.lastUpdateTime = block.timestamp;
        }
    }

    /**
     * @dev Calculate pending reward for a user
     * @param user Address of the user
     * @return Pending reward amount
     */
    function _calculatePendingReward(address user) internal view returns (uint256) {
        StakeData memory userStake = stakes[user];
        
        if (userStake.amount == 0 || rewardRate == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - userStake.lastUpdateTime;
        if (timeElapsed == 0) {
            return 0;
        }
        
        // Calculate reward: (stakeAmount * rewardRate * timeElapsed) / (PRECISION * SECONDS_PER_YEAR)
        uint256 reward = (userStake.amount * rewardRate * timeElapsed) / (PRECISION * SECONDS_PER_YEAR);
        
        return reward;
    }

    /**
     * @dev Calculate reward debt for accurate accounting
     * @param user Address of the user
     * @return Reward debt amount (total rewards earned since last update)
     */
    function _calculateRewardDebt(address user) internal view returns (uint256) {
        StakeData memory userStake = stakes[user];
        
        if (userStake.amount == 0 || rewardRate == 0) {
            return 0;
        }
        
        uint256 timeElapsed = block.timestamp - userStake.lastUpdateTime;
        if (timeElapsed == 0) {
            return userStake.rewardDebt;
        }
        
        // Calculate total reward that should have been earned since last update
        uint256 totalReward = (userStake.amount * rewardRate * timeElapsed) / (PRECISION * SECONDS_PER_YEAR);
        
        return userStake.rewardDebt + totalReward;
    }
}

