// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AirdropVault} from "../src/AirdropVault.sol";

contract MaliciousRecipient {
    AirdropVault public vault;

    constructor(AirdropVault _vault) {
        vault = _vault;
    }

    receive() external payable {
        // Attempt reentrancy during BOT payout
        if (
            address(vault).balance >= 0.1 ether &&
            vault.balanceOf(address(this)) >= 1000 ether
        ) {
            try vault.convertAIRToBOT(1000 ether) {} catch {}
        }
    }
}

contract AirdropVaultTest is Test {
    AirdropVault public vault;

    address public admin = address(0xAD01);
    address public campaignManager = address(0xCA01);
    address public rewardManager = address(0x0001);
    address public treasuryManager = address(0x0002);
    address public verifier = address(0x0003);
    address public pauser = address(0x0004);

    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public charlie = address(0xCC01);
    address public unauthorizedUser = address(0x9999);

    uint256 public constant MAX_AIR_SUPPLY = 50_000_000 * 1e18; // 50 Million AIR
    uint256 public constant INITIAL_RATE_AIR = 1000 * 1e18; // 1000 AIR
    uint256 public constant INITIAL_RATE_BOT = 1e17; // 0.1 BOT
    uint256 public constant MIN_CONVERSION_AIR = 1000 * 1e18; // 1000 AIR
    uint256 public constant MAX_CONVERSION_AIR = 100_000 * 1e18; // 100,000 AIR

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        AirdropVault.CampaignCategory category,
        uint256 rewardPerUser,
        uint256 totalAllocation,
        uint256 maximumParticipants,
        uint256 startTime,
        uint256 claimDeadline,
        string verificationType
    );
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
    event EligibilityApproved(uint256 indexed campaignId, address indexed user);

    function setUp() public {
        vm.deal(admin, 100 ether);
        vm.deal(treasuryManager, 50 ether);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);

        vm.prank(admin);
        vault = new AirdropVault(
            admin,
            MAX_AIR_SUPPLY,
            INITIAL_RATE_AIR,
            INITIAL_RATE_BOT,
            MIN_CONVERSION_AIR,
            MAX_CONVERSION_AIR
        );

        // Configure operational roles
        vm.startPrank(admin);
        vault.grantRole(vault.CAMPAIGN_MANAGER_ROLE(), campaignManager);
        vault.grantRole(vault.REWARD_MANAGER_ROLE(), rewardManager);
        vault.grantRole(vault.TREASURY_MANAGER_ROLE(), treasuryManager);
        vault.grantRole(vault.VERIFIER_ROLE(), verifier);
        vault.grantRole(vault.PAUSER_ROLE(), pauser);
        vm.stopPrank();

        // Fund the treasury BOT pool
        vm.prank(treasuryManager);
        vault.depositBOT{value: 20 ether}();
    }

    // --- 1. Deployment and Initialization ---

    function test_InitialDeploymentState() public view {
        assertEq(vault.name(), "AirdropVault");
        assertEq(vault.symbol(), "AIR");
        assertEq(vault.decimals(), 18);
        assertEq(vault.MAX_AIR_SUPPLY(), MAX_AIR_SUPPLY);
        assertEq(vault.totalAirMinted(), 0);
        assertEq(vault.totalSupply(), 0);
        assertEq(vault.conversionRateAIR(), INITIAL_RATE_AIR);
        assertEq(vault.conversionRateBOT(), INITIAL_RATE_BOT);
        assertEq(vault.minConversionAIR(), MIN_CONVERSION_AIR);
        assertEq(vault.maxConversionAIR(), MAX_CONVERSION_AIR);
        assertEq(vault.getBOTPoolBalance(), 20 ether);
        assertEq(vault.paused(), false);

        assertTrue(vault.hasRole(vault.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(
            vault.hasRole(vault.CAMPAIGN_MANAGER_ROLE(), campaignManager)
        );
        assertTrue(vault.hasRole(vault.REWARD_MANAGER_ROLE(), rewardManager));
        assertTrue(
            vault.hasRole(vault.TREASURY_MANAGER_ROLE(), treasuryManager)
        );
        assertTrue(vault.hasRole(vault.VERIFIER_ROLE(), verifier));
        assertTrue(vault.hasRole(vault.PAUSER_ROLE(), pauser));
    }

    function test_ConstructorValidation() public {
        vm.expectRevert(AirdropVault.ZeroAddress.selector);
        new AirdropVault(
            address(0),
            MAX_AIR_SUPPLY,
            INITIAL_RATE_AIR,
            INITIAL_RATE_BOT,
            MIN_CONVERSION_AIR,
            MAX_CONVERSION_AIR
        );

        vm.expectRevert(AirdropVault.ZeroAmount.selector);
        new AirdropVault(
            admin,
            0,
            INITIAL_RATE_AIR,
            INITIAL_RATE_BOT,
            MIN_CONVERSION_AIR,
            MAX_CONVERSION_AIR
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InvalidCampaignParameters.selector,
                "Invalid rate"
            )
        );
        new AirdropVault(
            admin,
            MAX_AIR_SUPPLY,
            0,
            INITIAL_RATE_BOT,
            MIN_CONVERSION_AIR,
            MAX_CONVERSION_AIR
        );
    }

    // --- 2. Roles & Permissions ---

    function test_RoleAccessControl() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        vault.createCampaign(
            "Title",
            "Desc",
            AirdropVault.CampaignCategory.DAILY,
            100 ether,
            1000 ether,
            10,
            block.timestamp,
            block.timestamp + 1 days,
            "VERIFIER"
        );

        vm.prank(unauthorizedUser);
        vm.expectRevert();
        vault.approveEligibility(1, alice);

        vm.prank(unauthorizedUser);
        vm.expectRevert();
        vault.setConversionRate(2000 ether, 0.1 ether);

        vm.prank(unauthorizedUser);
        vm.expectRevert();
        vault.pauseProtocol();
    }

    // --- 3. Campaign Creation & Validation ---

    function test_CreateCampaignSuccess() public {
        uint256 start = block.timestamp;
        uint256 deadline = start + 7 days;

        vm.prank(campaignManager);
        uint256 cId = vault.createCampaign(
            "Solidity Fundamentals",
            "Learn Solidity and earn AIR rewards",
            AirdropVault.CampaignCategory.LEARNING,
            100 * 1e18,
            10_000 * 1e18,
            100,
            start,
            deadline,
            "QUIZ_VERIFIER"
        );

        assertEq(cId, 1);
        assertEq(vault.campaignCount(), 1);

        (
            AirdropVault.Campaign memory c,
            AirdropVault.CampaignStatus status
        ) = vault.getCampaign(1);
        assertEq(c.title, "Solidity Fundamentals");
        assertEq(c.rewardPerUser, 100 * 1e18);
        assertEq(c.totalAllocation, 10_000 * 1e18);
        assertEq(c.remainingAllocation, 10_000 * 1e18);
        assertEq(c.maximumParticipants, 100);
        assertEq(c.currentParticipants, 0);
        assertEq(uint256(status), uint256(AirdropVault.CampaignStatus.ACTIVE));
    }

    function test_CreateCampaignValidationErrors() public {
        uint256 start = block.timestamp;
        uint256 deadline = start + 7 days;

        vm.startPrank(campaignManager);

        // Zero reward
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InvalidCampaignParameters.selector,
                "Reward must be > 0"
            )
        );
        vault.createCampaign(
            "T",
            "D",
            AirdropVault.CampaignCategory.DAILY,
            0,
            1000 ether,
            10,
            start,
            deadline,
            "V"
        );

        // Zero allocation
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InvalidCampaignParameters.selector,
                "Allocation must be > 0"
            )
        );
        vault.createCampaign(
            "T",
            "D",
            AirdropVault.CampaignCategory.DAILY,
            100 ether,
            0,
            10,
            start,
            deadline,
            "V"
        );

        // Reward * participants > totalAllocation
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InvalidCampaignParameters.selector,
                "Reward * participants exceeds allocation"
            )
        );
        vault.createCampaign(
            "T",
            "D",
            AirdropVault.CampaignCategory.DAILY,
            200 ether,
            1000 ether,
            10,
            start,
            deadline,
            "V"
        );

        // Start >= Deadline
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InvalidCampaignParameters.selector,
                "Start time must be before claim deadline"
            )
        );
        vault.createCampaign(
            "T",
            "D",
            AirdropVault.CampaignCategory.DAILY,
            100 ether,
            1000 ether,
            10,
            deadline,
            start,
            "V"
        );

        vm.stopPrank();
    }

    // --- 4. Eligibility Verification & Batch ---

    function test_EligibilityApprovalAndRevocation() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "Daily Sprint",
            "Desc",
            AirdropVault.CampaignCategory.DAILY,
            50 ether,
            500 ether,
            10,
            block.timestamp,
            block.timestamp + 1 days,
            "VERIFIER"
        );

        // Single approve
        vm.prank(verifier);
        vault.approveEligibility(1, alice);
        assertTrue(vault.hasEligibility(1, alice));

        // Revoke
        vm.prank(verifier);
        vault.revokeEligibility(1, alice);
        assertFalse(vault.hasEligibility(1, alice));

        // Batch approve
        address[] memory users = new address[](3);
        users[0] = alice;
        users[1] = bob;
        users[2] = charlie;

        vm.prank(verifier);
        vault.batchApproveEligibility(1, users);
        assertTrue(vault.hasEligibility(1, alice));
        assertTrue(vault.hasEligibility(1, bob));
        assertTrue(vault.hasEligibility(1, charlie));
    }

    // --- 5. Claim Flow & Integrity ---

    function test_SuccessfulClaim() public {
        uint256 reward = 200 * 1e18;
        uint256 allocation = 20_000 * 1e18;

        vm.prank(campaignManager);
        vault.createCampaign(
            "Community Drop",
            "Desc",
            AirdropVault.CampaignCategory.COMMUNITY,
            reward,
            allocation,
            100,
            block.timestamp,
            block.timestamp + 3 days,
            "VERIFIER"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, alice);

        // Check before claim
        assertEq(vault.balanceOf(alice), 0);
        assertEq(vault.totalSupply(), 0);

        // Claim
        vm.prank(alice);
        vault.claim(1);

        // Check after claim
        assertEq(vault.balanceOf(alice), reward);
        assertEq(vault.totalSupply(), reward);
        assertEq(vault.totalAirMinted(), reward);
        assertEq(vault.totalAirClaimed(), reward);
        assertTrue(vault.hasClaimed(1, alice));

        (AirdropVault.Campaign memory c, ) = vault.getCampaign(1);
        assertEq(c.remainingAllocation, allocation - reward);
        assertEq(c.currentParticipants, 1);
    }

    function test_DuplicateClaimReverts() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "Community Drop",
            "Desc",
            AirdropVault.CampaignCategory.COMMUNITY,
            100 ether,
            1000 ether,
            10,
            block.timestamp,
            block.timestamp + 3 days,
            "VERIFIER"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, alice);

        vm.prank(alice);
        vault.claim(1);

        // Repeat claim fails
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.AlreadyClaimed.selector,
                1,
                alice
            )
        );
        vault.claim(1);
    }

    function test_UnapprovedClaimReverts() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "Community Drop",
            "Desc",
            AirdropVault.CampaignCategory.COMMUNITY,
            100 ether,
            1000 ether,
            10,
            block.timestamp,
            block.timestamp + 3 days,
            "VERIFIER"
        );

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(AirdropVault.NotEligible.selector, 1, bob)
        );
        vault.claim(1);
    }

    function test_ClaimBeforeStartAndAfterDeadline() public {
        uint256 nowTime = block.timestamp;
        uint256 futureStart = nowTime + 1 days;
        uint256 deadline = futureStart + 2 days;

        vm.prank(campaignManager);
        vault.createCampaign(
            "Future Campaign",
            "Desc",
            AirdropVault.CampaignCategory.DAILY,
            100 ether,
            1000 ether,
            10,
            futureStart,
            deadline,
            "VERIFIER"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, alice);

        // Before start: UPCOMING
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.CampaignNotActive.selector,
                1,
                AirdropVault.CampaignStatus.UPCOMING
            )
        );
        vault.claim(1);

        // Warp to active
        vm.warp(futureStart + 1 hours);
        vm.prank(alice);
        vault.claim(1);
        assertEq(vault.balanceOf(alice), 100 ether);

        // Warp after deadline
        vm.warp(deadline + 1 seconds);
        vm.prank(verifier);
        vault.approveEligibility(1, bob);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.CampaignNotActive.selector,
                1,
                AirdropVault.CampaignStatus.ENDED
            )
        );
        vault.claim(1);
    }

    function test_AllocationExhaustion() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "Limited Drop",
            "Desc",
            AirdropVault.CampaignCategory.FREE_DROP,
            100 ether,
            200 ether,
            2,
            block.timestamp,
            block.timestamp + 1 days,
            "VERIFIER"
        );

        vm.startPrank(verifier);
        vault.approveEligibility(1, alice);
        vault.approveEligibility(1, bob);
        vault.approveEligibility(1, charlie);
        vm.stopPrank();

        vm.prank(alice);
        vault.claim(1);
        vm.prank(bob);
        vault.claim(1);

        // Charlie tries to claim on exhausted campaign
        vm.prank(charlie);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.CampaignNotActive.selector,
                1,
                AirdropVault.CampaignStatus.EXHAUSTED
            )
        );
        vault.claim(1);
    }

    // --- 6. Conversion Engine (AIR -> Native BOT) ---

    function test_ConvertAirToNativeBotSuccess() public {
        // Setup Alice with 5,000 AIR
        vm.prank(campaignManager);
        vault.createCampaign(
            "Big Task",
            "Desc",
            AirdropVault.CampaignCategory.ON_CHAIN,
            5000 * 1e18,
            50000 * 1e18,
            10,
            block.timestamp,
            block.timestamp + 5 days,
            "VERIFIER"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, alice);

        vm.prank(alice);
        vault.claim(1);
        assertEq(vault.balanceOf(alice), 5000 * 1e18);

        // Convert 5,000 AIR -> Rate: 1000 AIR = 0.1 BOT -> 5,000 AIR = 0.5 BOT
        uint256 aliceBotBefore = alice.balance;
        uint256 poolBotBefore = vault.getBOTPoolBalance();

        vm.prank(alice);
        vault.convertAIRToBOT(5000 * 1e18);

        // Verification
        assertEq(vault.balanceOf(alice), 0);
        assertEq(vault.totalSupply(), 0); // Converted AIR burned
        assertEq(alice.balance, aliceBotBefore + 0.5 ether);
        assertEq(vault.getBOTPoolBalance(), poolBotBefore - 0.5 ether);
        assertEq(vault.totalAirConverted(), 5000 * 1e18);
        assertEq(vault.totalBotDistributed(), 0.5 ether);
    }

    function test_ExactConversion10000AirTo1Bot() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "Mega Sprint",
            "Desc",
            AirdropVault.CampaignCategory.COMMUNITY,
            10000 * 1e18,
            20000 * 1e18,
            2,
            block.timestamp,
            block.timestamp + 5 days,
            "VERIFIER"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, bob);

        vm.prank(bob);
        vault.claim(1);

        uint256 bobBotBefore = bob.balance;
        vm.prank(bob);
        vault.convertAIRToBOT(10000 * 1e18);

        assertEq(bob.balance, bobBotBefore + 1 ether);
    }

    function test_ConversionLimitsAndInsufficientLiquidity() public {
        // Minimum limit check (< 1000 AIR)
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InvalidConversionAmount.selector,
                500 * 1e18,
                MIN_CONVERSION_AIR,
                MAX_CONVERSION_AIR
            )
        );
        vault.convertAIRToBOT(500 * 1e18);

        // Maximum limit check (> 100,000 AIR)
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InvalidConversionAmount.selector,
                150_000 * 1e18,
                MIN_CONVERSION_AIR,
                MAX_CONVERSION_AIR
            )
        );
        vault.convertAIRToBOT(150_000 * 1e18);

        // Insufficient balance check
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InsufficientAirBalance.selector,
                0,
                1000 * 1e18
            )
        );
        vault.convertAIRToBOT(1000 * 1e18);
    }

    function test_InsufficientBotPoolLiquidityReverts() public {
        // Deploy vault with 0 BOT in pool
        vm.prank(admin);
        AirdropVault dryVault = new AirdropVault(
            admin,
            MAX_AIR_SUPPLY,
            INITIAL_RATE_AIR,
            INITIAL_RATE_BOT,
            MIN_CONVERSION_AIR,
            MAX_CONVERSION_AIR
        );

        vm.prank(admin);
        dryVault.createCampaign(
            "Test",
            "Desc",
            AirdropVault.CampaignCategory.DAILY,
            1000 * 1e18,
            10000 * 1e18,
            10,
            block.timestamp,
            block.timestamp + 1 days,
            "V"
        );

        vm.prank(admin);
        dryVault.approveEligibility(1, alice);

        vm.prank(alice);
        dryVault.claim(1);

        // Attempt convert when pool has 0 BOT
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.InsufficientBotLiquidity.selector,
                0,
                0.1 ether
            )
        );
        dryVault.convertAIRToBOT(1000 * 1e18);
    }

    // --- 7. Treasury & Rate Config ---

    function test_TreasuryFundingAndRateUpdates() public {
        uint256 poolBefore = vault.getBOTPoolBalance();

        // Direct receive
        vm.prank(alice);
        (bool sent, ) = address(vault).call{value: 2 ether}("");
        assertTrue(sent);
        assertEq(vault.getBOTPoolBalance(), poolBefore + 2 ether);

        // Update rate
        vm.prank(treasuryManager);
        vault.setConversionRate(2000 * 1e18, 0.1 ether); // Now 2000 AIR = 0.1 BOT
        assertEq(vault.conversionRateAIR(), 2000 * 1e18);

        // Update limits
        vm.prank(treasuryManager);
        vault.setConversionLimits(2000 * 1e18, 50_000 * 1e18);
        assertEq(vault.minConversionAIR(), 2000 * 1e18);
        assertEq(vault.maxConversionAIR(), 50_000 * 1e18);
    }

    // --- 8. Emergency Pause Control ---

    function test_ProtocolPauseBlocksClaimsAndConversions() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "Pause Test",
            "Desc",
            AirdropVault.CampaignCategory.DAILY,
            1000 * 1e18,
            5000 * 1e18,
            5,
            block.timestamp,
            block.timestamp + 1 days,
            "V"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, alice);

        // Pause
        vm.prank(pauser);
        vault.pauseProtocol();
        assertTrue(vault.paused());

        // Claim fails when paused
        vm.prank(alice);
        vm.expectRevert();
        vault.claim(1);

        // Unpause
        vm.prank(pauser);
        vault.unpauseProtocol();
        assertFalse(vault.paused());

        // Claim succeeds
        vm.prank(alice);
        vault.claim(1);
        assertEq(vault.balanceOf(alice), 1000 * 1e18);
    }

    // --- 9. Reentrancy Protection ---

    function test_ReentrancyAttackSafelyBlocked() public {
        MaliciousRecipient attacker = new MaliciousRecipient(vault);
        vm.deal(address(attacker), 1 ether);

        vm.prank(campaignManager);
        vault.createCampaign(
            "Attack Campaign",
            "Desc",
            AirdropVault.CampaignCategory.COMMUNITY,
            2000 * 1e18,
            20000 * 1e18,
            10,
            block.timestamp,
            block.timestamp + 1 days,
            "V"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, address(attacker));

        // Attacker claims
        vm.prank(address(attacker));
        vault.claim(1);
        assertEq(vault.balanceOf(address(attacker)), 2000 * 1e18);

        // Attacker attempts conversion; even if receive() tries reentrant conversion, it will not steal additional BOT
        uint256 poolBefore = vault.getBOTPoolBalance();
        vm.prank(address(attacker));
        vault.convertAIRToBOT(1000 * 1e18);

        // Exactly 0.1 BOT distributed, exactly 1000 AIR burned
        assertEq(vault.getBOTPoolBalance(), poolBefore - 0.1 ether);
        assertEq(vault.balanceOf(address(attacker)), 1000 * 1e18);
    }

    // --- 10. Protocol & User Stats Getters ---

    function test_ProtocolAndUserStatsGetters() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "Stats Test",
            "Desc",
            AirdropVault.CampaignCategory.DAILY,
            1000 * 1e18,
            10000 * 1e18,
            10,
            block.timestamp,
            block.timestamp + 1 days,
            "V"
        );

        (
            uint256 totalCampaigns,
            uint256 activeCampaigns,
            uint256 totalAirClaimed,
            uint256 totalAirConverted,
            uint256 totalBotDistributed,
            uint256 botPool,
            uint256 airSupply,
            uint256 maxSupply,
            uint256 totalMinted
        ) = vault.getProtocolStats();

        assertEq(totalCampaigns, 1);
        assertEq(activeCampaigns, 1);
        assertEq(totalAirClaimed, 0);
        assertEq(totalAirConverted, 0);
        assertEq(totalBotDistributed, 0);
        assertEq(botPool, 20 ether);
        assertEq(airSupply, 0);
        assertEq(maxSupply, MAX_AIR_SUPPLY);
        assertEq(totalMinted, 0);
    }

    // --- 11. Additional Tests: Global Cap, Cancel, ERC20 Transfers & Math ---

    function test_GlobalAirSupplyCapEnforced() public {
        uint256 tinyCap = 500 * 1e18;
        vm.prank(admin);
        AirdropVault cappedVault = new AirdropVault(
            admin,
            tinyCap,
            INITIAL_RATE_AIR,
            INITIAL_RATE_BOT,
            MIN_CONVERSION_AIR,
            MAX_CONVERSION_AIR
        );

        vm.startPrank(admin);
        cappedVault.createCampaign(
            "Capped Campaign",
            "Desc",
            AirdropVault.CampaignCategory.COMMUNITY,
            300 * 1e18,
            600 * 1e18,
            2,
            block.timestamp,
            block.timestamp + 1 days,
            "V"
        );
        cappedVault.approveEligibility(1, alice);
        cappedVault.approveEligibility(1, bob);
        vm.stopPrank();

        vm.prank(alice);
        cappedVault.claim(1);
        assertEq(cappedVault.totalAirMinted(), 300 * 1e18);

        // Bob's claim of 300 would make total 600 > 500 cap
        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.GlobalCapExceeded.selector,
                300 * 1e18,
                200 * 1e18
            )
        );
        cappedVault.claim(1);
    }

    function test_CancelCampaignLifecycle() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "To Cancel",
            "Desc",
            AirdropVault.CampaignCategory.DAILY,
            100 * 1e18,
            1000 * 1e18,
            10,
            block.timestamp,
            block.timestamp + 1 days,
            "V"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, alice);

        // Alice claims before cancel
        vm.prank(alice);
        vault.claim(1);
        assertEq(vault.balanceOf(alice), 100 * 1e18);

        // Manager cancels campaign
        vm.prank(campaignManager);
        vault.cancelCampaign(1);

        (
            AirdropVault.Campaign memory c,
            AirdropVault.CampaignStatus status
        ) = vault.getCampaign(1);
        assertTrue(c.isCancelled);
        assertEq(
            uint256(status),
            uint256(AirdropVault.CampaignStatus.CANCELLED)
        );

        // Bob tries to claim cancelled campaign
        vm.prank(verifier);
        vault.approveEligibility(1, bob);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.CampaignNotActive.selector,
                1,
                AirdropVault.CampaignStatus.CANCELLED
            )
        );
        vault.claim(1);

        // Alice's pre-claimed AIR is still intact
        assertEq(vault.balanceOf(alice), 100 * 1e18);
    }

    function test_PauseAndUnpauseCampaign() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "Pauseable Campaign",
            "Desc",
            AirdropVault.CampaignCategory.COMMUNITY,
            100 * 1e18,
            1000 * 1e18,
            10,
            block.timestamp,
            block.timestamp + 1 days,
            "V"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, alice);

        // Pause single campaign
        vm.prank(campaignManager);
        vault.pauseCampaign(1);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                AirdropVault.CampaignNotActive.selector,
                1,
                AirdropVault.CampaignStatus.PAUSED
            )
        );
        vault.claim(1);

        // Unpause single campaign
        vm.prank(campaignManager);
        vault.unpauseCampaign(1);

        vm.prank(alice);
        vault.claim(1);
        assertEq(vault.balanceOf(alice), 100 * 1e18);
    }

    function test_ERC20TransfersAndApprovals() public {
        vm.prank(campaignManager);
        vault.createCampaign(
            "ERC20 Test",
            "Desc",
            AirdropVault.CampaignCategory.DAILY,
            1000 * 1e18,
            10000 * 1e18,
            10,
            block.timestamp,
            block.timestamp + 1 days,
            "V"
        );

        vm.prank(verifier);
        vault.approveEligibility(1, alice);

        vm.prank(alice);
        vault.claim(1);

        // Standard transfer
        vm.prank(alice);
        vault.transfer(bob, 400 * 1e18);
        assertEq(vault.balanceOf(alice), 600 * 1e18);
        assertEq(vault.balanceOf(bob), 400 * 1e18);

        // Approve and transferFrom
        vm.prank(bob);
        vault.approve(charlie, 200 * 1e18);
        assertEq(vault.allowance(bob, charlie), 200 * 1e18);

        vm.prank(charlie);
        vault.transferFrom(bob, charlie, 200 * 1e18);
        assertEq(vault.balanceOf(bob), 200 * 1e18);
        assertEq(vault.balanceOf(charlie), 200 * 1e18);
    }

    function test_CalculationAndLiquidityGetters() public view {
        // 1000 AIR => 0.1 BOT
        assertEq(vault.calculateBOTOutput(1000 * 1e18), 0.1 ether);
        // 10000 AIR => 1 BOT
        assertEq(vault.calculateBOTOutput(10000 * 1e18), 1 ether);
        // 1 BOT => 10000 AIR
        assertEq(vault.calculateAIRInput(1 ether), 10000 * 1e18);

        // Pool balance is 20 ether -> 20 ether can convert 200,000 AIR, but capped by maxConversionAIR (100,000 AIR)
        assertEq(vault.getCurrentlyConvertibleAIR(), 100_000 * 1e18);
    }
}
