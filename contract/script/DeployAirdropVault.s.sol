// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AirdropVault} from "../src/AirdropVault.sol";

contract DeployAirdropVault is Script {
    uint256 public constant MAX_AIR_SUPPLY = 50_000_000 * 1e18; // 50 Million AIR cap
    uint256 public constant INITIAL_RATE_AIR = 1000 * 1e18; // 1000 AIR
    uint256 public constant INITIAL_RATE_BOT = 1e17; // 0.1 BOT
    uint256 public constant MIN_CONVERSION_AIR = 1000 * 1e18; // 1000 AIR
    uint256 public constant MAX_CONVERSION_AIR = 100_000 * 1e18; // 100,000 AIR

    function run() external returns (AirdropVault vault) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==================================================");
        console.log("DEPLOYING AIRDROPVAULT TO BOHR TESTNET (CHAIN 968)");
        console.log("Deployer Address:", deployer);
        console.log("Deployer Balance:", deployer.balance);
        console.log("MAX AIR SUPPLY:", MAX_AIR_SUPPLY / 1e18, "AIR");
        console.log("==================================================");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy the unified AirdropVault contract
        vault = new AirdropVault(
            deployer,
            MAX_AIR_SUPPLY,
            INITIAL_RATE_AIR,
            INITIAL_RATE_BOT,
            MIN_CONVERSION_AIR,
            MAX_CONVERSION_AIR
        );

        address contractAddress = address(vault);
        console.log("AirdropVault Contract Deployed At:", contractAddress);

        // 2. Fund initial BOT conversion pool if deployer has sufficient balance
        uint256 fundingAmount = 0.5 ether; // 0.5 BOT for initial testnet conversion liquidity
        if (deployer.balance >= fundingAmount) {
            vault.depositBOT{value: fundingAmount}();
            console.log(
                "Funded BOT Conversion Pool with:",
                fundingAmount / 1e18,
                "BOT"
            );
        }

        // 3. Create Genesis bounded demo campaign
        uint256 startTime = block.timestamp;
        uint256 claimDeadline = block.timestamp + 30 days;
        uint256 rewardPerUser = 200 * 1e18; // 200 AIR
        uint256 totalAllocation = 20_000 * 1e18; // 20,000 AIR
        uint256 maxParticipants = 100;

        uint256 campaignId = vault.createCampaign(
            "Genesis Community Welcome Drop",
            "Welcome to AirdropVault! Complete community onboarding task to claim 200 AIR.",
            AirdropVault.CampaignCategory.COMMUNITY,
            rewardPerUser,
            totalAllocation,
            maxParticipants,
            startTime,
            claimDeadline,
            "VERIFIER_ONBOARDING"
        );
        console.log("Created Genesis Demo Campaign ID:", campaignId);

        // Also create a Developer / Learning challenge campaign
        uint256 c2Id = vault.createCampaign(
            "Bohr Smart Contract Developer Challenge",
            "Build and interact with Bohr Testnet smart contracts to claim 500 AIR.",
            AirdropVault.CampaignCategory.LEARNING,
            500 * 1e18,
            25_000 * 1e18,
            50,
            startTime,
            claimDeadline,
            "DEV_VERIFIER"
        );
        console.log("Created Developer Challenge Campaign ID:", c2Id);

        // Create Daily Web3 Check-in campaign
        uint256 c3Id = vault.createCampaign(
            "Daily Web3 Ecosystem Check-in",
            "Daily task reward for active Bohr Testnet community participants.",
            AirdropVault.CampaignCategory.DAILY,
            50 * 1e18,
            5_000 * 1e18,
            100,
            startTime,
            claimDeadline,
            "DAILY_CHECKIN"
        );
        console.log("Created Daily Check-in Campaign ID:", c3Id);

        // Approve deployer eligibility for instant demo testing
        vault.approveEligibility(campaignId, deployer);
        vault.approveEligibility(c2Id, deployer);
        vault.approveEligibility(c3Id, deployer);
        console.log("Approved deployer eligibility on initial campaigns");

        vm.stopBroadcast();

        console.log("==================================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("Contract Address:", contractAddress);
        console.log("AIR Token Address:", contractAddress);
        console.log(
            "Bohr Explorer:",
            string.concat(
                "https://scan.bohr.life/address/",
                vm.toString(contractAddress)
            )
        );
        console.log("BOT Pool Balance:", address(vault).balance);
        console.log("==================================================");
    }
}
