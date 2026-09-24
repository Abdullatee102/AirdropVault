# AirdropVault — On-Chain Airdrop & Reward Campaign Marketplace

**Live Production Application**: [https://airdrop-vault-kohl.vercel.app/](https://airdrop-vault-kohl.vercel.app/)

**AirdropVault** is a complete, production-ready decentralized application built for the **Bohr Testnet**. It unites reward campaign creation, task eligibility verification, bounded mint-on-claim ERC-20 rewards (`AIR`), and an atomic native `BOT` liquidity conversion pool within **one single deployed smart contract**.

---

## 🌟 Key Architecture & Highlights

1. **One Deployed Smart Contract Architecture**:
   - Contract: `AirdropVault.sol`
   - Address on Bohr Testnet: [`0xFeCE26cE87096A449DF46748C45739B541b1f5BC`](https://scan.bohr.life/address/0xFeCE26cE87096A449DF46748C45739B541b1f5BC)
   - Combines OpenZeppelin standard ERC-20 (`AIR`), granular role-based access control (`CAMPAIGN_MANAGER_ROLE`, `VERIFIER_ROLE`, `TREASURY_ROLE`, `PAUSER_ROLE`), a campaign lifecycle engine, and a native BOT liquidity treasury.

2. **Strict Economic Bounds (No Infinite Faucets)**:
   - **Global Supply Cap (`MAX_AIR_SUPPLY`)**: `50,000,000 AIR` (Hard-capped ceiling).
   - **Allocations**: Every campaign has an allocated ceiling (`totalAllocation`) and a maximum participant capacity (`maxParticipants`).
   - **Mint-on-Claim**: `AIR` tokens are minted strictly when verified users execute a valid on-chain claim.

3. **AIR-to-BOT Conversion Engine**:
   - **Protocol Conversion Rate**: `1,000 AIR = 0.1 BOT` (`10,000 AIR = 1 BOT`).
   - **Conversion Economics**: Zero conversion fees. Converted `AIR` tokens are burned directly from user balance, and native `BOT` is transferred from contract treasury atomically.
   - **Safe Atomic Execution**: Enforces `ReentrancyGuard`, verifies available native BOT pool balance before burning, and reverts completely if liquidity is insufficient.

4. **Modern, Responsive Web3 UI**:
   - Built with React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Wagmi v2, Viem, and Reown AppKit.
   - Live liquidity inspection, campaign search/filtering, task verification simulation, conversion rate calculator, user portfolio tracking with MetaMask token import, and admin management console.

---

## 🌐 Network Configuration (Bohr Testnet)

| Parameter           | Value                                            |
| ------------------- | ------------------------------------------------ |
| **Network Name**    | Bohr Testnet                                     |
| **RPC Endpoint**    | `https://rpc.bohr.life`                          |
| **Chain ID**        | `968`                                            |
| **Currency Symbol** | `BOT` (18 decimals)                              |
| **Block Explorer**  | [https://scan.bohr.life](https://scan.bohr.life) |

---

## 📦 Smart Contract Summary

- **Contract Name**: `AirdropVault`
- **Token Name**: `AirdropVault`
- **Token Symbol**: `AIR` (18 decimals)
- **Deployed Address**: `0xFeCE26cE87096A449DF46748C45739B541b1f5BC`
- **Deployer / Admin**: `0xC357A22d19e72abA2d4cd954a38774D98ebF0868`
- **Deployment Transaction**: `0x5a4bccb553cae7c062001ecbf3d1ecc8f232194aa4c964cc78815f16b967246c`
- **Initial Native BOT Liquidity Deposited**: `0.5 BOT` (500,000,000,000,000,000 wei)
- **Configured Global Supply Cap**: `50,000,000 AIR`
- **Conversion Limits**: Min `1,000 AIR` / Max `100,000 AIR` per transaction

---

## 🛠️ System Workflows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AIRDROPVAULT ENGINE                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┼────────────────────────────────┐
     ▼                                 ▼                                ▼
[ 1. Campaign Creation ]      [ 2. Verification & Claim ]    [ 3. AIR-to-BOT Conversion ]
Manager creates campaign       Verifier approves user         User requests conversion
with bounded allocation.       address on-chain.              AIR burned atomically.
Starts & deadlines set.        User mints AIR to wallet.      Native BOT sent to wallet.
```

### 1. User Journey

1. Connect Web3 wallet (MetaMask, Rainbow, Coinbase, etc.) to **Bohr Testnet**.
2. Explore active reward campaigns on the **Marketplace**.
3. Complete off-chain / on-chain task requirements (social, liquidity, testnet actions).
4. Have address approved by designated verifiers (`VERIFIER_ROLE`).
5. Execute `claimReward(campaignId)` on-chain to mint genuine ERC-20 `AIR` tokens.
6. Hold `AIR` or navigate to **Convert** to exchange `AIR` for native `BOT` at the guaranteed rate.

### 2. Campaign Manager Flow

1. Accounts with `CAMPAIGN_MANAGER_ROLE` create campaigns via `createCampaign(...)`.
2. Define total allocation, reward per participant, start time, deadline, and task metadata.
3. Manage campaign statuses (Active, Paused, Cancelled, Completed).

### 3. Treasury & Liquidity Flow

1. Protocol treasury operators deposit native `BOT` via `depositBOT()` (`payable`).
2. Live contract state tracks `totalBotDeposited`, `totalBotConverted`, and current pool balance `address(this).balance`.
3. If pool liquidity reaches zero, conversions are gracefully locked in the UI and revert safely on-chain.

---

## 🧪 Testing & Verification

The smart contract contains a complete test suite written in Foundry covering all core behaviors, edge cases, economic bounds, and security vectors:

```bash
cd contract
forge test
```

### Test Coverage (24/24 Passed - 100% Success Rate)

- `test_InitialDeploymentState`: Verifies token metadata, admin roles, default rates, and initial state.
- `test_CreateCampaignSuccess` & `test_CreateCampaignValidationErrors`: Validates input ranges, allocations, and deadlines.
- `test_EligibilityApprovalAndRevocation`: Tests single and batch verification workflows.
- `test_SuccessfulClaim`: Verifies balance minting, participant counter increments, and allocation depletion.
- `test_DuplicateClaimReverts`: Prevents multiple claims per user per campaign.
- `test_ClaimBeforeStartAndAfterDeadline`: Enforces time-bound campaign lifecycles.
- `test_GlobalAirSupplyCapEnforced`: Asserts minting reverts once global cap is saturated.
- `test_ConvertAirToNativeBotSuccess`: Tests exact AIR burn and native BOT transfer.
- `test_ExactConversion10000AirTo1Bot`: Verifies 10,000 AIR yields exactly 1 BOT without loss.
- `test_InsufficientBotPoolLiquidityReverts`: Protects users if contract liquidity is exhausted.
- `test_ConversionLimitsAndInsufficientLiquidity`: Validates min/max conversion boundaries.
- `test_ReentrancyAttackSafelyBlocked`: Validates reentrancy guard during conversion.
- `test_ProtocolPauseBlocksClaimsAndConversions`: Verifies emergency pause controls.

---

## 💻 Local Development Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Foundry (`forge`, `cast`)

### 1. Smart Contract

```bash
cd contract
forge install
forge build
forge test
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to interact with the application.

---

## 📜 License

MIT License. Built for the Bohr Network Ecosystem.
