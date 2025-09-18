# Project Description

**Deployed Frontend URL:** LINK

**Solana Program ID:** ID

## Project Overview

### Description

A simple decentralized counter application built on Solana. Users can create personal counters, increment them, and reset them to zero. Each user has their own counter account derived from their wallet address, ensuring data isolation and ownership. This dApp demonstrates basic Solana program development concepts including PDAs, account creation, and state management.

### Key Features

- **Create Counter**: Initialize a new counter account for your wallet
- **Increment Counter**: Add 1 to your personal counter value
- **Reset Counter**: Set your counter back to 0
- **View Counter**: Display current counter value and owner information

### How to Use the dApp

1. **Connect Wallet** - Connect your Solana wallet
2. **Initialize Counter** - Click "Create Counter" to set up your personal counter account
3. **Increment** - Use the "+" button to increase your counter value
4. **Reset** - Click "Reset" to set your counter back to 0
5. **View Stats** - See your current count and total increments made

## Program Architecture

The Counter dApp uses a simple architecture with one main account type and three core instructions. The program leverages PDAs to create unique counter accounts for each user, ensuring data isolation and preventing conflicts between different users' counters.

### PDA Usage

The program uses Program Derived Addresses to create deterministic counter accounts for each user.

**PDAs Used:**

- **Counter PDA**: Derived from seeds `["counter", user_wallet_pubkey]` - ensures each user has a unique counter account that only they can modify

### Program Instructions

**Instructions Implemented:**

- **Initialize**: Creates a new counter account for the user with initial value of 0
- **Increment**: Increases the counter value by 1 and tracks total increments
- **Reset**: Sets the counter value back to 0 while preserving the owner information

### Account Structure

```rust
#[account]
pub struct Counter {
    pub owner: Pubkey,        // The wallet that owns this counter
    pub count: u64,           // Current counter value
    pub total_increments: u64, // Total number of times incremented (persists through resets)
    pub created_at: i64,      // Unix timestamp when counter was created
}
```

## Testing

### Test Coverage

Comprehensive test suite covering all instructions with both successful operations and error conditions to ensure program security and reliability.

**Happy Path Tests:**

- **Initialize Counter**: Successfully creates a new counter account with correct initial values
- **Increment Counter**: Properly increases count and total_increments by 1
- **Reset Counter**: Sets count to 0 while preserving owner and total_increments

**Unhappy Path Tests:**

- **Initialize Duplicate**: Fails when trying to initialize a counter that already exists
- **Increment Unauthorized**: Fails when non-owner tries to increment someone else's counter
- **Reset Unauthorized**: Fails when non-owner tries to reset someone else's counter
- **Account Not Found**: Fails when trying to operate on non-existent counter

### Running Tests

```bash
yarn install    # install dependencies
anchor test     # run tests
```

### Additional Notes for Evaluators

This was my first Solana dApp and the learning curve was steep! The biggest challenges were figuring out account ownership validation (kept getting unauthorized errors) and dealing with async transaction confirmations. PDAs were confusing at first but once they clicked, the deterministic addressing made everything much cleaner.
