# Project Description

**Deployed Frontend URL:** https://frontend-ow4rd3lfk-routineforbots-projects.vercel.app

**Solana Program ID:** 9uTQy7AX7qd9xHDzcbK1mkraGPAMT7G3o1h2Ei8i4rAZ (Devnet)

## Project Overview

### Description

Decentralized Blog dApp on Solana built with Anchor. Users initialize a `UserProfile` (PDA), set a short handle (username), and manage posts. PDA derivation ensures each user owns an isolated profile and their posts are uniquely addressed.

### Key Features

- **Initialize Profile**: Create your personal `UserProfile` PDA
- **Set Handle**: Choose a short handle (username) stored on-chain
- **Create/Update/Delete Post**: Manage posts (title <= 64, content <= 512)
- **List My Posts**: Fetch and display all posts for the connected profile
- **Deterministic Addresses**: Accounts are derived from seeds for predictability and safety

### How to Use the dApp

1. **Connect Wallet** - Connect your Solana wallet (Devnet)
2. **Initialize Profile** - Click "Initialize User" to create your profile PDA
3. **Set Handle** - Enter a short handle and click "Set Handle"
4. **Create Post** - Provide a title and content, then click "Create Post"
5. **Update Post** - Modify existing posts by providing post ID, new title, and/or content
6. **Delete Post** - Remove posts by providing the post ID
7. **Verify** - Transactions confirm on Devnet; you can refetch your profile or posts

## Program Architecture

Two accounts and five instructions. PDAs provide deterministic addresses and `has_one` constraints enforce authority.

### PDA Usage

The program uses Program Derived Addresses for deterministic account creation.

**PDAs Used:**

- **UserProfile PDA**: seeds `["user_profile", user_wallet_pubkey]`
- **Post PDA**: seeds `["post", user_profile_pubkey, post_count_le_bytes]`

### Program Instructions

**Instructions Implemented:**

- **initialize_user**
- **set_handle(new_handle: string)**
- **create_post(title: string, content: string)**
- **update_post(new_title: string, new_content: string)**
- **delete_post()**

### Account Structure

```rust
#[account]
pub struct UserProfile {
    pub authority: Pubkey,  // wallet that owns this profile
    pub handle: String,     // short username (<= 32 bytes)
    pub post_count: u64,    // number of posts created
    pub bump: u8,
}

#[account]
pub struct Post {
    pub authority: Pubkey,      // owner wallet
    pub user_profile: Pubkey,   // associated profile PDA
    pub post_id: u64,           // sequential ID
    pub title: String,          // <= 64 bytes
    pub content: String,        // <= 512 bytes
    pub bump: u8,
}
```

## Frontend Features

### User Interface

- **Modern React UI**: Built with Vite and React for fast development
- **Wallet Integration**: Seamless Phantom wallet connection
- **Transaction Management**: 60-second timeout for reliable Devnet operations
- **Real-time Updates**: UI refreshes after successful blockchain operations
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Responsive Design**: Clean, modern interface optimized for all devices

### Transaction Handling

- **Extended Timeouts**: 60-second confirmation timeouts for Devnet reliability
- **Error Recovery**: Graceful handling of network issues and transaction failures
- **Status Updates**: Real-time feedback on transaction progress and completion

## Testing

### Test Coverage

Comprehensive test suite covering all instructions with both successful operations and error conditions to ensure program security and reliability.

**Happy Path Tests:**

- **Initialize User**: Successfully creates a new profile PDA
- **Set Handle**: Stores the provided handle on the profile
- **Create Post**: Creates a post PDA and increments `post_count`
- **Update Post**: Modifies existing post title and content
- **Delete Post**: Removes posts and handles account cleanup

**Unhappy Path Tests:**

- **Unauthorized Set Handle**: Fails when non-owner tries to set someone else's handle
- **Unauthorized Create Post**: Fails when non-owner tries to create a post for someone else
- **Unauthorized Update Post**: Fails when non-owner tries to modify someone else's post
- **Unauthorized Delete Post**: Fails when non-owner tries to delete someone else's post
- **Invalid Input**: Handles overly long titles, content, and handles appropriately

### Running Tests

```bash
yarn           # in anchor-project/blog, if node modules missing
anchor test    # run tests
```

## Technical Implementation

### IDL Handling

- **Robust IDL Loading**: Fetches IDL from chain with timeout fallback
- **Local IDL Fallback**: Bundled IDL ensures functionality even if chain fetch fails
- **Account Client Issues**: Prevents AccountClient construction problems

### Transaction Encoding

- **BorshInstructionCoder**: Manual instruction encoding for reliability
- **Manual Transaction Building**: Direct control over transaction construction
- **Error Handling**: Comprehensive error catching and user feedback

## Additional Notes for Evaluators

This project demonstrates:

- **PDA Implementation**: Proper use of Program Derived Addresses for deterministic account creation
- **Authority Management**: Secure `has_one` constraints for user authorization
- **Comprehensive CRUD Operations**: Full Create, Read, Update, Delete functionality for posts
- **User Profile Management**: Custom handle system for user identification
- **Frontend Integration**: Complete React frontend with wallet connectivity
- **Transaction Reliability**: Extended timeouts and error handling for production readiness
- **Testing Coverage**: Both happy and unhappy path testing for all instructions

The additional features beyond basic blog posting include:

1. **User Handle System**: Users can set and display custom usernames
2. **Post Management**: Full CRUD operations for blog posts
3. **Advanced UI**: Modern React interface with real-time updates and error handling

The dApp is fully functional on Solana Devnet and ready for production deployment.

This is my very very first Solana dapp!!!
