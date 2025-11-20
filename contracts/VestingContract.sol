// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title VestingContract
 * @dev Secure vesting contract that locks tokens and releases them linearly over time
 * @notice Supports cliff periods, linear vesting, and beneficiary-only claims
 * 
 * Features:
 * - Create vesting schedules for beneficiaries
 * - Linear token release over time
 * - Cliff period support (no tokens released before cliff)
 * - Beneficiary-only claims
 * - Multiple vesting schedules per beneficiary
 * - Safe token transfers
 * - Reentrancy protection
 */
contract VestingContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev The ERC20 token being vested
    IERC20 public immutable vestingToken;

    /// @dev Vesting schedule data
    struct VestingSchedule {
        address beneficiary;      // Address that will receive tokens
        uint256 totalAmount;     // Total amount of tokens to vest
        uint256 claimedAmount;   // Amount of tokens already claimed
        uint64 startTime;        // Vesting start timestamp
        uint64 cliffDuration;    // Cliff duration in seconds (0 = no cliff)
        uint64 vestingDuration;  // Total vesting duration in seconds
        bool revoked;            // Whether vesting has been revoked
    }

    /// @dev Mapping of vesting schedule ID to schedule data
    mapping(bytes32 => VestingSchedule) public vestingSchedules;
    
    /// @dev Mapping of beneficiary to their vesting schedule IDs
    mapping(address => bytes32[]) public beneficiarySchedules;
    
    /// @dev Total number of vesting schedules
    uint256 public vestingScheduleCount;
    
    /// @dev Total amount of tokens in all vesting schedules
    uint256 public totalVestedAmount;
    
    /// @dev Total amount of tokens claimed
    uint256 public totalClaimedAmount;

    /// @dev Event emitted when a vesting schedule is created
    event VestingCreated(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 totalAmount,
        uint64 startTime,
        uint64 cliffDuration,
        uint64 vestingDuration
    );
    
    /// @dev Event emitted when tokens are claimed
    event Claimed(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 amount
    );
    
    /// @dev Event emitted when a vesting schedule is revoked
    event VestingRevoked(bytes32 indexed scheduleId, address indexed beneficiary);

    /// @dev Custom error for invalid vesting parameters
    error InvalidVestingParameters();
    
    /// @dev Custom error for vesting not found
    error VestingNotFound();
    
    /// @dev Custom error for vesting revoked
    error VestingAlreadyRevoked();
    
    /// @dev Custom error for nothing to claim
    error NothingToClaim();
    
    /// @dev Custom error for cliff not reached
    error CliffNotReached(uint64 cliffTime);
    
    /// @dev Custom error for zero amount
    error ZeroAmount();

    /**
     * @dev Constructor
     * @param _vestingToken Address of the token to be vested
     */
    constructor(address _vestingToken) Ownable() {
        require(_vestingToken != address(0), "VestingContract: invalid token");
        vestingToken = IERC20(_vestingToken);
    }

    /**
     * @dev Create a new vesting schedule
     * @param beneficiary Address that will receive the vested tokens
     * @param totalAmount Total amount of tokens to vest
     * @param startTime Vesting start timestamp (0 = current block timestamp)
     * @param cliffDuration Cliff duration in seconds (0 = no cliff)
     * @param vestingDuration Total vesting duration in seconds
     * @return scheduleId The ID of the created vesting schedule
     */
    function createVesting(
        address beneficiary,
        uint256 totalAmount,
        uint64 startTime,
        uint64 cliffDuration,
        uint64 vestingDuration
    ) external onlyOwner nonReentrant returns (bytes32 scheduleId) {
        if (beneficiary == address(0)) revert InvalidVestingParameters();
        if (totalAmount == 0) revert ZeroAmount();
        if (vestingDuration == 0) revert InvalidVestingParameters();
        if (cliffDuration > vestingDuration) revert InvalidVestingParameters();
        
        // Use current time if startTime is 0
        if (startTime == 0) {
            startTime = uint64(block.timestamp);
        }
        
        // Generate unique schedule ID
        scheduleId = keccak256(
            abi.encodePacked(
                beneficiary,
                totalAmount,
                startTime,
                cliffDuration,
                vestingDuration,
                block.timestamp,
                vestingScheduleCount
            )
        );
        
        // Ensure schedule ID is unique
        require(
            vestingSchedules[scheduleId].beneficiary == address(0),
            "VestingContract: schedule already exists"
        );
        
        // Create vesting schedule
        vestingSchedules[scheduleId] = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: totalAmount,
            claimedAmount: 0,
            startTime: startTime,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            revoked: false
        });
        
        // Add to beneficiary's schedules
        beneficiarySchedules[beneficiary].push(scheduleId);
        
        vestingScheduleCount++;
        totalVestedAmount += totalAmount;
        
        // Transfer tokens to contract
        vestingToken.safeTransferFrom(msg.sender, address(this), totalAmount);
        
        emit VestingCreated(
            scheduleId,
            beneficiary,
            totalAmount,
            startTime,
            cliffDuration,
            vestingDuration
        );
    }

    /**
     * @dev Claim vested tokens for a specific schedule
     * @param scheduleId The ID of the vesting schedule
     */
    function claim(bytes32 scheduleId) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        
        if (schedule.beneficiary == address(0)) revert VestingNotFound();
        if (schedule.revoked) revert VestingAlreadyRevoked();
        if (msg.sender != schedule.beneficiary) {
            revert("VestingContract: not beneficiary");
        }
        
        uint256 claimableAmount = getClaimableAmount(scheduleId);
        if (claimableAmount == 0) revert NothingToClaim();
        
        // Update claimed amount
        schedule.claimedAmount += claimableAmount;
        totalClaimedAmount += claimableAmount;
        
        // Transfer tokens to beneficiary
        vestingToken.safeTransfer(schedule.beneficiary, claimableAmount);
        
        emit Claimed(scheduleId, schedule.beneficiary, claimableAmount);
    }

    /**
     * @dev Claim all available tokens for the caller across all their schedules
     */
    function claimAll() external nonReentrant {
        bytes32[] memory schedules = beneficiarySchedules[msg.sender];
        uint256 totalClaimable = 0;
        
        for (uint256 i = 0; i < schedules.length; i++) {
            bytes32 scheduleId = schedules[i];
            VestingSchedule storage schedule = vestingSchedules[scheduleId];
            
            if (schedule.beneficiary == msg.sender && !schedule.revoked) {
                uint256 claimable = getClaimableAmount(scheduleId);
                if (claimable > 0) {
                    schedule.claimedAmount += claimable;
                    totalClaimable += claimable;
                    
                    emit Claimed(scheduleId, schedule.beneficiary, claimable);
                }
            }
        }
        
        if (totalClaimable == 0) revert NothingToClaim();
        
        totalClaimedAmount += totalClaimable;
        vestingToken.safeTransfer(msg.sender, totalClaimable);
    }

    /**
     * @dev Revoke a vesting schedule (owner only)
     * @param scheduleId The ID of the vesting schedule to revoke
     */
    function revokeVesting(bytes32 scheduleId) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        
        if (schedule.beneficiary == address(0)) revert VestingNotFound();
        if (schedule.revoked) revert VestingAlreadyRevoked();
        
        schedule.revoked = true;
        
        // Calculate unvested amount and return to owner
        uint256 vestedAmount = getVestedAmount(scheduleId);
        uint256 unvestedAmount = schedule.totalAmount - vestedAmount;
        
        if (unvestedAmount > 0) {
            vestingToken.safeTransfer(owner(), unvestedAmount);
        }
        
        emit VestingRevoked(scheduleId, schedule.beneficiary);
    }

    /**
     * @dev Get the claimable amount for a vesting schedule
     * @param scheduleId The ID of the vesting schedule
     * @return Claimable token amount
     */
    function getClaimableAmount(bytes32 scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[scheduleId];
        
        if (schedule.beneficiary == address(0) || schedule.revoked) {
            return 0;
        }
        
        uint256 vested = getVestedAmount(scheduleId);
        if (vested > schedule.claimedAmount) {
            return vested - schedule.claimedAmount;
        }
        
        return 0;
    }

    /**
     * @dev Get the vested amount for a vesting schedule
     * @param scheduleId The ID of the vesting schedule
     * @return Vested token amount
     */
    function getVestedAmount(bytes32 scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[scheduleId];
        
        if (schedule.beneficiary == address(0)) {
            return 0;
        }
        
        uint64 currentTime = uint64(block.timestamp);
        
        // Check if vesting has started
        if (currentTime < schedule.startTime) {
            return 0;
        }
        
        // Check cliff period
        uint64 cliffTime = schedule.startTime + schedule.cliffDuration;
        if (currentTime < cliffTime) {
            return 0;
        }
        
        // Calculate vested amount (linear vesting)
        uint64 elapsed = currentTime - schedule.startTime;
        
        if (elapsed >= schedule.vestingDuration) {
            // Fully vested
            return schedule.totalAmount;
        }
        
        // Linear vesting: vested = totalAmount * elapsed / vestingDuration
        return (schedule.totalAmount * uint256(elapsed)) / uint256(schedule.vestingDuration);
    }

    /**
     * @dev Get all vesting schedule IDs for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @return Array of schedule IDs
     */
    function getBeneficiarySchedules(address beneficiary) external view returns (bytes32[] memory) {
        return beneficiarySchedules[beneficiary];
    }

    /**
     * @dev Get vesting schedule details
     * @param scheduleId The ID of the vesting schedule
     * @return schedule Vesting schedule data
     */
    function getVestingSchedule(bytes32 scheduleId) external view returns (VestingSchedule memory) {
        return vestingSchedules[scheduleId];
    }

    /**
     * @dev Get total claimable amount for a beneficiary across all schedules
     * @param beneficiary Address of the beneficiary
     * @return Total claimable amount
     */
    function getTotalClaimable(address beneficiary) external view returns (uint256) {
        bytes32[] memory schedules = beneficiarySchedules[beneficiary];
        uint256 total = 0;
        
        for (uint256 i = 0; i < schedules.length; i++) {
            total += getClaimableAmount(schedules[i]);
        }
        
        return total;
    }
}

