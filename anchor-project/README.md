# Solana Blog dApp - Anchor Program

A decentralized blog application built on Solana using the Anchor framework. This program implements user profiles with custom handles and full CRUD operations for blog posts using Program Derived Addresses (PDAs).

## Deployment

**Program ID**: `9uTQy7AX7qd9xHDzcbK1mkraGPAMT7G3o1h2Ei8i4rAZ`  
**Network**: Solana Devnet  
**Status**: Deployed and Active

## Architecture

### Program Structure

The program consists of two main account types and five core instructions:

#### **Accounts**

- **UserProfile**: Stores user information and post count
- **Post**: Individual blog posts with title and content

#### **Instructions**

- `initialize_user` - Create a new user profile
- `set_handle` - Set or update user's custom handle
- `create_post` - Create a new blog post
- `update_post` - Modify existing post content
- `delete_post` - Remove posts from the blockchain

### PDA Implementation

The program uses Program Derived Addresses for deterministic account creation:

```rust
// UserProfile PDA
seeds = [b"user_profile", authority.key().as_ref()]

// Post PDA
seeds = [b"post", user_profile.key().as_ref(), post_count.to_le_bytes()]
```

## Tech Stack

- **Framework**: Anchor (Solana development framework)
- **Language**: Rust
- **Blockchain**: Solana
- **Testing**: TypeScript with Anchor test framework
- **Build Tool**: Cargo (Rust package manager)

## Project Structure

```
anchor-project/
├── blog/
│   ├── programs/
│   │   └── blog/
│   │       ├── src/
│   │       │   └── lib.rs          # Main program logic
│   │       └── Cargo.toml          # Rust dependencies
│   ├── tests/
│   │   └── blog.js                 # TypeScript tests
│   ├── Anchor.toml                 # Anchor configuration
│   ├── Cargo.toml                  # Workspace configuration
│   └── target/                     # Build artifacts
└── README.md                       # This file
```

## Getting Started

### Prerequisites

- **Rust**: Latest stable version (1.70+)
- **Solana CLI**: Latest version
- **Anchor CLI**: Latest version
- **Node.js**: 16+ for testing
- **Yarn**: Package manager

### Installation

1. **Install Rust**

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Install Solana CLI**

   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

3. **Install Anchor CLI**

   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

4. **Clone and setup**
   ```bash
   cd anchor-project/blog
   yarn install
   ```

## Development

### Building the Program

```bash
cd anchor-project/blog
anchor build
```

### Running Tests

```bash
anchor test
```

This will:

- Build the program
- Start a local validator
- Run all TypeScript tests
- Shut down the validator

### Test Coverage

The test suite covers:

#### **Happy Path Tests**

- ✅ User profile initialization
- ✅ Handle setting
- ✅ Post creation
- ✅ Post updates
- ✅ Post deletion

#### **Unhappy Path Tests**

- ✅ Unauthorized access attempts
- ✅ Invalid input validation
- ✅ Error handling scenarios

## Program Details

### Account Sizes

```rust
// UserProfile account size
pub const MAX_SIZE: usize = 32    // authority (Pubkey)
    + 4 + MAX_HANDLE_LEN         // handle (String)
    + 8                          // post_count (u64)
    + 1;                         // bump (u8)

// Post account size
pub const MAX_SIZE: usize = 32    // authority (Pubkey)
    + 32                         // user_profile (Pubkey)
    + 8                          // post_id (u64)
    + 4 + MAX_TITLE_LEN          // title (String)
    + 4 + MAX_CONTENT_LEN        // content (String)
    + 1;                         // bump (u8)
```

### Constraints

- **Handle Length**: Maximum 32 bytes
- **Title Length**: Maximum 64 bytes
- **Content Length**: Maximum 512 bytes
- **Authority**: Only profile owner can modify their data

## Deployment

### Local Development

```bash
anchor build
anchor deploy
```

### Devnet Deployment

```bash
anchor build
anchor deploy --provider.cluster devnet
```

### Mainnet Deployment

```bash
anchor build
anchor deploy --provider.cluster mainnet
```

## Testing

### Running Specific Tests

```bash
# Run all tests
anchor test

# Run with specific test file
anchor test --skip-local-validator
```

### Test Environment

Tests run against a local Solana validator with:

- Pre-funded test wallets
- Isolated environment
- Fast execution
- Detailed logging

### Test Utilities

The test suite includes helper functions for:

- PDA derivation
- Account creation
- Transaction building
- Error verification

## Configuration

### Anchor.toml

```toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
blog = "9uTQy7AX7qd9xHDzcbK1mkraGPAMT7G3o1h2Ei8i4rAZ"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

### Cargo.toml

```toml
[dependencies]
anchor-lang = "0.29.0"
```

## Security Features

- **PDA Validation**: Ensures account ownership
- **Authority Checks**: `has_one` constraints for security
- **Input Validation**: Length and format checking
- **Error Handling**: Comprehensive error codes
- **Account Isolation**: Users can only modify their own data

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Ensure Rust toolchain is up to date
   - Check Anchor version compatibility
   - Clear target directory: `cargo clean`

2. **Test Failures**

   - Verify Solana CLI version
   - Check wallet configuration
   - Ensure sufficient SOL for testing

3. **Deployment Issues**
   - Verify network configuration
   - Check wallet balance
   - Confirm program ID uniqueness

### Debug Mode

Enable debug logging:

```bash
export RUST_LOG=debug
anchor test
```

## Documentation

- **Anchor Book**: https://book.anchor-lang.com/
- **Solana Docs**: https://docs.solana.com/
- **Rust Book**: https://doc.rust-lang.org/book/

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add comprehensive tests
5. Submit a pull request

## License

This project is part of the Solana School curriculum and follows their licensing terms.

## Links

- **Frontend**: [Frontend README](../frontend/README.md)
- **Project Description**: [PROJECT_DESCRIPTION.md](../PROJECT_DESCRIPTION.md)
- **Solana School**: https://school.solana.com/
- **Anchor Framework**: https://www.anchor-lang.com/
