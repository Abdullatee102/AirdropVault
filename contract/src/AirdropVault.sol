// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AirdropVault
 * @notice Unified smart contract powering the AirdropVault platform.
 * Combines AIR ERC-20 token, Campaign Lifecycle Engine, and Native BOT Conversion Vault.
 */
contract AirdropVault is ERC20, AccessControl, Pausable, ReentrancyGuard {
    // --- Roles ---
    bytes32 public constant CAMPAIGN_MANAGER_ROLE =
        keccak256("CAMPAIGN_MANAGER_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE =
        keccak256("REWARD_MANAGER_ROLE");
    bytes32 public constant TREASURY_MANAGER_ROLE =
        keccak256("TREASURY_MANAGER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // --- Campaign Types & Statuses ---
    enum CampaignCategory {
        DAILY, // 0
        COMMUNITY, // 1
        REFERRAL, // 2
        LEARNING, // 3
        ON_CHAIN, // 4
        FREE_DROP, // 5
        CUSTOM // 6
    }

    enum CampaignStatus {
        UPCOMING, // 0
        ACTIVE, // 1
        PAUSED, // 2
        EXHAUSTED, // 3
        ENDED, // 4
        CANCELLED // 5
    }

    struct Campaign {
        uint256 campaignId;
        address creator;
        string title;
        string description;
        CampaignCategory category;
        uint256 rewardPerUser;
        uint256 totalAllocation;
        uint256 remainingAllocation;
        uint256 maximumParticipants;
        uint256 currentParticipants;
        uint256 startTime;
        uint256 claimDeadline;
        string verificationType;
        bool isPaused;
        bool isCancelled;
    }

    // --- Global Economic Constraints ---
    uint256 public immutable MAX_AIR_SUPPLY;
    uint256 public totalAirMinted;

    // --- Conversion Parameters ---
    // Initial rate: 1000 AIR = 0.1 BOT -> 1000 * 1e18 AIR = 1e17 wei BOT (0.1 BOT)
    uint256 public conversionRateAIR;
    uint256 public conversionRateBOT;
    uint256 public minConversionAIR;
    uint256 public maxConversionAIR;

    // --- Protocol Cumulative Statistics ---
    uint256 public totalAirClaimed;
    uint256 public totalAirConverted;
    uint256 public totalBotDistributed;
    uint256 public totalBotDeposited;

    // --- Campaigns Storage ---
    uint256 public campaignCount;
    mapping(uint256 => Campaign) private _campaigns;

    // Campaign ID => User => Claimed
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    // Campaign ID => User => Verified Eligibility
    mapping(uint256 => mapping(address => bool)) public hasEligibility;

    // User cumulative stats
    mapping(address => uint256) public userTotalAirClaimed;
    mapping(address => uint256) public userTotalAirConverted;
    mapping(address => uint256) public userTotalBotReceived;

    // --- Events ---
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        CampaignCategory category,
        uint256 rewardPerUser,
        uint256 totalAllocation,
        uint256 maximumParticipants,
        uint256 startTime,
        uint256 claimDeadline,
        string verificationType
    );
    event CampaignActivated(uint256 indexed campaignId);
    event CampaignPaused(uint256 indexed campaignId);
    event CampaignCancelled(uint256 indexed campaignId);
    event EligibilityApproved(uint256 indexed campaignId, address indexed user);
    event EligibilityBatchApproved(uint256 indexed campaignId, address[] users);
    event EligibilityRevoked(uint256 indexed campaignId, address indexed user);
    event CampaignClaimed(
        uint256 indexed campaignId,
        address indexed user,
        uint256 rewardAmount,
        uint256 timestamp
    );
    event AIRConverted(
        address indexed user,
        uint256 airBurned,
        uint256 botReceived,
        uint256 timestamp
    );
    event BOTPoolFunded(
        address indexed sender,
        uint256 amount,
        uint256 newPoolBalance,
        uint256 timestamp
    );
    event ConversionRateUpdated(uint256 newRateAIR, uint256 newRateBOT);
    event ConversionLimitsUpdated(uint256 newMinAIR, uint256 newMaxAIR);
    event ProtocolPaused(address indexed account);
    event ProtocolUnpaused(address indexed account);

    // --- Custom Errors ---
    error GlobalCapExceeded(uint256 requested, uint256 available);
    error InvalidCampaignParameters(string reason);
    error CampaignNotFound(uint256 campaignId);
    error CampaignNotActive(uint256 campaignId, CampaignStatus status);
    error AlreadyClaimed(uint256 campaignId, address user);
    error NotEligible(uint256 campaignId, address user);
    error AllocationExhausted(uint256 campaignId);
    error ParticipantLimitReached(uint256 campaignId);
    error InvalidConversionAmount(uint256 amount, uint256 min, uint256 max);
    error InsufficientAirBalance(uint256 balance, uint256 requested);
    error InsufficientBotLiquidity(uint256 available, uint256 required);
    error BotTransferFailed(address recipient, uint256 amount);
    error ZeroAddress();
    error ZeroAmount();

    /**
     * @notice Constructor initializes the AirdropVault token, roles, caps, and conversion rates.
     * @param initialAdmin Address of initial default admin and role holder
     * @param maxAirSupply Total global cap of AIR that can ever be minted
     * @param initialRateAIR Rate AIR numerator (e.g., 1000 * 1e18)
     * @param initialRateBOT Rate BOT numerator (e.g., 0.1 * 1e18 = 1e17)
     * @param initialMinConversion Minimum AIR required to convert (e.g., 1000 * 1e18)
     * @param initialMaxConversion Maximum AIR permitted in one conversion (e.g., 100000 * 1e18)
     */
    constructor(
        address initialAdmin,
        uint256 maxAirSupply,
        uint256 initialRateAIR,
        uint256 initialRateBOT,
        uint256 initialMinConversion,
        uint256 initialMaxConversion
    ) ERC20("AirdropVault", "AIR") {
        if (initialAdmin == address(0)) revert ZeroAddress();
        if (maxAirSupply == 0) revert ZeroAmount();
        if (initialRateAIR == 0 || initialRateBOT == 0)
            revert InvalidCampaignParameters("Invalid rate");
        if (
            initialMinConversion == 0 ||
            initialMinConversion > initialMaxConversion
        ) {
            revert InvalidConversionAmount(
                initialMinConversion,
                1,
                initialMaxConversion
            );
        }

        MAX_AIR_SUPPLY = maxAirSupply;
        conversionRateAIR = initialRateAIR;
        conversionRateBOT = initialRateBOT;
        minConversionAIR = initialMinConversion;
        maxConversionAIR = initialMaxConversion;

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(CAMPAIGN_MANAGER_ROLE, initialAdmin);
        _grantRole(REWARD_MANAGER_ROLE, initialAdmin);
        _grantRole(TREASURY_MANAGER_ROLE, initialAdmin);
        _grantRole(VERIFIER_ROLE, initialAdmin);
        _grantRole(PAUSER_ROLE, initialAdmin);
    }

    // --- Campaign Creation & Management ---

    /**
     * @notice Creates a new reward campaign with strictly validated economic constraints.
     * @param title Title of the campaign
     * @param description Compact description / reference
     * @param category Category enum (DAILY, COMMUNITY, REFERRAL, etc.)
     * @param rewardPerUser AIR reward per claiming user (in wei)
     * @param totalAllocation Maximum total AIR allocated to this campaign (in wei)
     * @param maximumParticipants Maximum number of participants allowed to claim
     * @param startTime Unix timestamp when claims become valid
     * @param claimDeadline Unix timestamp when claims close
     * @param verificationType Verification method identifier (e.g. "VERIFIER_OFFCHAIN", "COMMUNITY_TASK")
     * @return campaignId Newly assigned unique campaign ID
     */
    function createCampaign(
        string calldata title,
        string calldata description,
        CampaignCategory category,
        uint256 rewardPerUser,
        uint256 totalAllocation,
        uint256 maximumParticipants,
        uint256 startTime,
        uint256 claimDeadline,
        string calldata verificationType
    ) external onlyRole(CAMPAIGN_MANAGER_ROLE) returns (uint256 campaignId) {
        if (rewardPerUser == 0)
            revert InvalidCampaignParameters("Reward must be > 0");
        if (totalAllocation == 0)
            revert InvalidCampaignParameters("Allocation must be > 0");
        if (maximumParticipants == 0)
            revert InvalidCampaignParameters("Max participants must be > 0");
        if (rewardPerUser * maximumParticipants > totalAllocation) {
            revert InvalidCampaignParameters(
                "Reward * participants exceeds allocation"
            );
        }
        if (startTime >= claimDeadline) {
            revert InvalidCampaignParameters(
                "Start time must be before claim deadline"
            );
        }

        campaignId = ++campaignCount;

        _campaigns[campaignId] = Campaign({
            campaignId: campaignId,
            creator: msg.sender,
            title: title,
            description: description,
            category: category,
            rewardPerUser: rewardPerUser,
            totalAllocation: totalAllocation,
            remainingAllocation: totalAllocation,
            maximumParticipants: maximumParticipants,
            currentParticipants: 0,
            startTime: startTime,
            claimDeadline: claimDeadline,
            verificationType: verificationType,
            isPaused: false,
            isCancelled: false
        });

        emit CampaignCreated(
            campaignId,
            msg.sender,
            title,
            category,
            rewardPerUser,
            totalAllocation,
            maximumParticipants,
            startTime,
            claimDeadline,
            verificationType
        );
    }

    /**
     * @notice Pauses an active campaign.
     * @param campaignId ID of campaign
     */
    function pauseCampaign(
        uint256 campaignId
    ) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);
        Campaign storage c = _campaigns[campaignId];
        if (c.isCancelled)
            revert InvalidCampaignParameters("Campaign is cancelled");
        c.isPaused = true;
        emit CampaignPaused(campaignId);
    }

    /**
     * @notice Resumes a paused campaign.
     * @param campaignId ID of campaign
     */
    function unpauseCampaign(
        uint256 campaignId
    ) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);
        Campaign storage c = _campaigns[campaignId];
        if (c.isCancelled)
            revert InvalidCampaignParameters("Campaign is cancelled");
        c.isPaused = false;
        emit CampaignActivated(campaignId);
    }

    /**
     * @notice Cancels a campaign. Pre-claimed rewards remain valid; future claims are prevented.
     * @param campaignId ID of campaign
     */
    function cancelCampaign(
        uint256 campaignId
    ) external onlyRole(CAMPAIGN_MANAGER_ROLE) {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);
        Campaign storage c = _campaigns[campaignId];
        if (c.isCancelled)
            revert InvalidCampaignParameters("Already cancelled");
        c.isCancelled = true;
        emit CampaignCancelled(campaignId);
    }

    // --- Eligibility Management ---

    /**
     * @notice Verifier approves a user's eligibility for a specific campaign.
     * @param campaignId ID of campaign
     * @param user Recipient wallet
     */
    function approveEligibility(
        uint256 campaignId,
        address user
    ) external onlyRole(VERIFIER_ROLE) {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);
        if (user == address(0)) revert ZeroAddress();
        hasEligibility[campaignId][user] = true;
        emit EligibilityApproved(campaignId, user);
    }

    /**
     * @notice Verifier batch approves multiple users.
     * @param campaignId ID of campaign
     * @param users Array of recipient wallets
     */
    function batchApproveEligibility(
        uint256 campaignId,
        address[] calldata users
    ) external onlyRole(VERIFIER_ROLE) {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);
        for (uint256 i = 0; i < users.length; i++) {
            address u = users[i];
            if (u != address(0)) {
                hasEligibility[campaignId][u] = true;
                emit EligibilityApproved(campaignId, u);
            }
        }
        emit EligibilityBatchApproved(campaignId, users);
    }

    /**
     * @notice Revokes a user's eligibility if needed before claim.
     * @param campaignId ID of campaign
     * @param user Recipient wallet
     */
    function revokeEligibility(
        uint256 campaignId,
        address user
    ) external onlyRole(VERIFIER_ROLE) {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);
        hasEligibility[campaignId][user] = false;
        emit EligibilityRevoked(campaignId, user);
    }

    // --- Reward Claim Flow ---

    /**
     * @notice User claims their verified AIR reward for an active campaign.
     * Mints genuine ERC-20 AIR tokens directly to user wallet on-claim.
     * @param campaignId ID of campaign
     */
    function claim(uint256 campaignId) external nonReentrant whenNotPaused {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);

        Campaign storage c = _campaigns[campaignId];
        CampaignStatus status = getCampaignStatus(campaignId);
        if (status != CampaignStatus.ACTIVE) {
            revert CampaignNotActive(campaignId, status);
        }

        if (hasClaimed[campaignId][msg.sender]) {
            revert AlreadyClaimed(campaignId, msg.sender);
        }

        if (!hasEligibility[campaignId][msg.sender]) {
            revert NotEligible(campaignId, msg.sender);
        }

        uint256 reward = c.rewardPerUser;
        if (c.remainingAllocation < reward) {
            revert AllocationExhausted(campaignId);
        }

        if (c.currentParticipants >= c.maximumParticipants) {
            revert ParticipantLimitReached(campaignId);
        }

        if (totalAirMinted + reward > MAX_AIR_SUPPLY) {
            revert GlobalCapExceeded(reward, MAX_AIR_SUPPLY - totalAirMinted);
        }

        // State updates (Checks-Effects-Interactions)
        hasClaimed[campaignId][msg.sender] = true;
        c.remainingAllocation -= reward;
        c.currentParticipants += 1;
        totalAirMinted += reward;
        totalAirClaimed += reward;
        userTotalAirClaimed[msg.sender] += reward;

        // Mint real ERC20 AIR tokens to claimant
        _mint(msg.sender, reward);

        emit CampaignClaimed(campaignId, msg.sender, reward, block.timestamp);
    }

    // --- Native BOT Conversion Engine ---

    /**
     * @notice Converts user's AIR tokens into native BOT at the protocol rate.
     * Converted AIR is burned from circulation and native BOT is sent directly to user.
     * @param airAmount Amount of AIR in wei to convert
     */
    function convertAIRToBOT(
        uint256 airAmount
    ) external nonReentrant whenNotPaused {
        if (airAmount < minConversionAIR || airAmount > maxConversionAIR) {
            revert InvalidConversionAmount(
                airAmount,
                minConversionAIR,
                maxConversionAIR
            );
        }

        if (balanceOf(msg.sender) < airAmount) {
            revert InsufficientAirBalance(balanceOf(msg.sender), airAmount);
        }

        uint256 botAmount = calculateBOTOutput(airAmount);
        if (botAmount == 0) revert ZeroAmount();

        if (address(this).balance < botAmount) {
            revert InsufficientBotLiquidity(address(this).balance, botAmount);
        }

        // Effects
        totalAirConverted += airAmount;
        totalBotDistributed += botAmount;
        userTotalAirConverted[msg.sender] += airAmount;
        userTotalBotReceived[msg.sender] += botAmount;

        // Burn AIR tokens from caller
        _burn(msg.sender, airAmount);

        emit AIRConverted(msg.sender, airAmount, botAmount, block.timestamp);

        // Send native BOT to user atomically
        (bool success, ) = payable(msg.sender).call{value: botAmount}("");
        if (!success) {
            revert BotTransferFailed(msg.sender, botAmount);
        }
    }

    /**
     * @notice Deposit native BOT to fund the conversion treasury pool.
     */
    function depositBOT() external payable {
        if (msg.value == 0) revert ZeroAmount();
        totalBotDeposited += msg.value;
        emit BOTPoolFunded(
            msg.sender,
            msg.value,
            address(this).balance,
            block.timestamp
        );
    }

    /**
     * @notice Fallback receive function to accept direct native BOT deposits.
     */
    receive() external payable {
        if (msg.value > 0) {
            totalBotDeposited += msg.value;
            emit BOTPoolFunded(
                msg.sender,
                msg.value,
                address(this).balance,
                block.timestamp
            );
        }
    }

    // --- Configuration & Admin ---

    /**
     * @notice Updates the AIR to BOT conversion rate.
     * @param newRateAIR Rate AIR numerator (e.g. 1000 * 1e18)
     * @param newRateBOT Rate BOT numerator (e.g. 0.1 * 1e18)
     */
    function setConversionRate(
        uint256 newRateAIR,
        uint256 newRateBOT
    ) external onlyRole(TREASURY_MANAGER_ROLE) {
        if (newRateAIR == 0 || newRateBOT == 0)
            revert InvalidCampaignParameters("Rate cannot be 0");
        conversionRateAIR = newRateAIR;
        conversionRateBOT = newRateBOT;
        emit ConversionRateUpdated(newRateAIR, newRateBOT);
    }

    /**
     * @notice Updates the minimum and maximum conversion amounts in AIR.
     * @param newMinAIR Minimum AIR allowed per conversion
     * @param newMaxAIR Maximum AIR allowed per conversion
     */
    function setConversionLimits(
        uint256 newMinAIR,
        uint256 newMaxAIR
    ) external onlyRole(TREASURY_MANAGER_ROLE) {
        if (newMinAIR == 0 || newMinAIR > newMaxAIR) {
            revert InvalidConversionAmount(newMinAIR, 1, newMaxAIR);
        }
        minConversionAIR = newMinAIR;
        maxConversionAIR = newMaxAIR;
        emit ConversionLimitsUpdated(newMinAIR, newMaxAIR);
    }

    /**
     * @notice Emergency protocol pause.
     */
    function pauseProtocol() external onlyRole(PAUSER_ROLE) {
        _pause();
        emit ProtocolPaused(msg.sender);
    }

    /**
     * @notice Unpause protocol.
     */
    function unpauseProtocol() external onlyRole(PAUSER_ROLE) {
        _unpause();
        emit ProtocolUnpaused(msg.sender);
    }

    // --- Read & View Functions ---

    /**
     * @notice Calculates the exact BOT output for a given amount of AIR.
     * @param airAmount Amount of AIR in wei
     * @return botAmount Amount of native BOT in wei
     */
    function calculateBOTOutput(
        uint256 airAmount
    ) public view returns (uint256 botAmount) {
        if (conversionRateAIR == 0) return 0;
        botAmount = (airAmount * conversionRateBOT) / conversionRateAIR;
    }

    /**
     * @notice Calculates the required AIR for a given amount of BOT.
     * @param botAmount Amount of BOT in wei
     * @return airAmount Amount of AIR in wei
     */
    function calculateAIRInput(
        uint256 botAmount
    ) public view returns (uint256 airAmount) {
        if (conversionRateBOT == 0) return 0;
        airAmount = (botAmount * conversionRateAIR) / conversionRateBOT;
    }

    /**
     * @notice Returns the current native BOT balance in the conversion pool.
     */
    function getBOTPoolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Returns the maximum amount of AIR currently convertible given available BOT liquidity.
     */
    function getCurrentlyConvertibleAIR() external view returns (uint256) {
        uint256 poolBalance = address(this).balance;
        if (poolBalance == 0 || conversionRateBOT == 0) return 0;
        uint256 liquidityMaxAIR = (poolBalance * conversionRateAIR) /
            conversionRateBOT;
        return
            liquidityMaxAIR > maxConversionAIR
                ? maxConversionAIR
                : liquidityMaxAIR;
    }

    /**
     * @notice Derives the dynamic on-chain status of a campaign.
     * @param campaignId ID of campaign
     * @return status Current status enum
     */
    function getCampaignStatus(
        uint256 campaignId
    ) public view returns (CampaignStatus status) {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);
        Campaign storage c = _campaigns[campaignId];

        if (c.isCancelled) return CampaignStatus.CANCELLED;
        if (c.isPaused) return CampaignStatus.PAUSED;
        if (block.timestamp < c.startTime) return CampaignStatus.UPCOMING;
        if (block.timestamp > c.claimDeadline) return CampaignStatus.ENDED;
        if (
            c.remainingAllocation < c.rewardPerUser ||
            c.currentParticipants >= c.maximumParticipants
        ) {
            return CampaignStatus.EXHAUSTED;
        }
        return CampaignStatus.ACTIVE;
    }

    /**
     * @notice Returns details of a specific campaign along with its current status.
     * @param campaignId ID of campaign
     */
    function getCampaign(
        uint256 campaignId
    ) external view returns (Campaign memory campaign, CampaignStatus status) {
        if (campaignId == 0 || campaignId > campaignCount)
            revert CampaignNotFound(campaignId);
        campaign = _campaigns[campaignId];
        status = getCampaignStatus(campaignId);
    }

    /**
     * @notice Returns total number of campaigns created.
     */
    function getCampaignCount() external view returns (uint256) {
        return campaignCount;
    }

    /**
     * @notice Returns all campaigns created in the vault.
     */
    function getAllCampaigns()
        external
        view
        returns (Campaign[] memory campaigns, CampaignStatus[] memory statuses)
    {
        uint256 count = campaignCount;
        campaigns = new Campaign[](count);
        statuses = new CampaignStatus[](count);
        for (uint256 i = 1; i <= count; i++) {
            campaigns[i - 1] = _campaigns[i];
            statuses[i - 1] = getCampaignStatus(i);
        }
    }

    /**
     * @notice Returns claim and eligibility state for a specific user and campaign.
     */
    function getUserCampaignState(
        uint256 campaignId,
        address user
    ) external view returns (bool claimed, bool eligible) {
        claimed = hasClaimed[campaignId][user];
        eligible = hasEligibility[campaignId][user];
    }

    /**
     * @notice Returns user portfolio statistics.
     */
    function getUserStats(
        address user
    )
        external
        view
        returns (
            uint256 airBalance,
            uint256 totalClaimed,
            uint256 totalConverted,
            uint256 botReceived
        )
    {
        airBalance = balanceOf(user);
        totalClaimed = userTotalAirClaimed[user];
        totalConverted = userTotalAirConverted[user];
        botReceived = userTotalBotReceived[user];
    }

    /**
     * @notice Returns comprehensive protocol statistics.
     */
    function getProtocolStats()
        external
        view
        returns (
            uint256 _totalCampaigns,
            uint256 _activeCampaigns,
            uint256 _totalAirClaimed,
            uint256 _totalAirConverted,
            uint256 _totalBotDistributed,
            uint256 _botPoolBalance,
            uint256 _totalAirSupply,
            uint256 _maxAirSupply,
            uint256 _totalAirMinted
        )
    {
        _totalCampaigns = campaignCount;
        uint256 active = 0;
        for (uint256 i = 1; i <= campaignCount; i++) {
            if (getCampaignStatus(i) == CampaignStatus.ACTIVE) {
                active++;
            }
        }
        _activeCampaigns = active;
        _totalAirClaimed = totalAirClaimed;
        _totalAirConverted = totalAirConverted;
        _totalBotDistributed = totalBotDistributed;
        _botPoolBalance = address(this).balance;
        _totalAirSupply = totalSupply();
        _maxAirSupply = MAX_AIR_SUPPLY;
        _totalAirMinted = totalAirMinted;
    }

    /**
     * @notice Helper to check if an account possesses a role.
     */
    function checkRole(
        bytes32 role,
        address account
    ) external view returns (bool) {
        return hasRole(role, account);
    }
}
