use anchor_lang::prelude::*;

declare_id!("9uTQy7AX7qd9xHDzcbK1mkraGPAMT7G3o1h2Ei8i4rAZ");

// A simple Blog dApp with PDA-based UserProfile and Post accounts.
// Users initialize their profile, set a short handle, and create posts.

const MAX_HANDLE_LEN: usize = 32; // bytes
const MAX_TITLE_LEN: usize = 64; // bytes
const MAX_CONTENT_LEN: usize = 512; // bytes

#[program]
pub mod blog {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.authority = ctx.accounts.authority.key();
        user_profile.handle = String::new();
        user_profile.post_count = 0;
        user_profile.bump = ctx.bumps.user_profile;
        Ok(())
    }

    pub fn set_handle(ctx: Context<SetHandle>, new_handle: String) -> Result<()> {
        require!(
            new_handle.as_bytes().len() <= MAX_HANDLE_LEN,
            BlogError::HandleTooLong
        );
        let user_profile = &mut ctx.accounts.user_profile;
        // Only the authority can set their handle
        require_keys_eq!(user_profile.authority, ctx.accounts.authority.key(), BlogError::Unauthorized);
        user_profile.handle = new_handle;
        Ok(())
    }

    pub fn create_post(ctx: Context<CreatePost>, title: String, content: String) -> Result<()> {
        require!(title.as_bytes().len() <= MAX_TITLE_LEN, BlogError::TitleTooLong);
        require!(content.as_bytes().len() <= MAX_CONTENT_LEN, BlogError::ContentTooLong);

        let user_profile = &mut ctx.accounts.user_profile;
        // Only the authority can create posts for their profile
        require_keys_eq!(user_profile.authority, ctx.accounts.authority.key(), BlogError::Unauthorized);

        let post = &mut ctx.accounts.post;
        post.authority = user_profile.authority;
        post.user_profile = user_profile.key();
        post.title = title;
        post.content = content;
        post.post_id = user_profile.post_count;
        post.bump = ctx.bumps.post;

        // Increment post counter after successful creation
        user_profile.post_count = user_profile
            .post_count
            .checked_add(1)
            .ok_or(BlogError::Overflow)?;

        Ok(())
    }

    pub fn update_post(ctx: Context<UpdatePost>, new_title: String, new_content: String) -> Result<()> {
        require!(new_title.as_bytes().len() <= MAX_TITLE_LEN, BlogError::TitleTooLong);
        require!(new_content.as_bytes().len() <= MAX_CONTENT_LEN, BlogError::ContentTooLong);

        let user_profile = &ctx.accounts.user_profile;
        require_keys_eq!(user_profile.authority, ctx.accounts.authority.key(), BlogError::Unauthorized);

        let post = &mut ctx.accounts.post;
        // Post already verified via PDA seeds and relation to user_profile
        post.title = new_title;
        post.content = new_content;
        Ok(())
    }

    pub fn delete_post(_ctx: Context<DeletePost>) -> Result<()> {
        // Account will be closed to authority via account attribute on context
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction()]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + UserProfile::MAX_SIZE,
        seeds = [b"user_profile", authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetHandle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user_profile", user_profile.authority.as_ref()],
        bump = user_profile.bump,
        has_one = authority @ BlogError::Unauthorized
    )]
    pub user_profile: Account<'info, UserProfile>,
}

#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user_profile", user_profile.authority.as_ref()],
        bump = user_profile.bump,
        has_one = authority @ BlogError::Unauthorized
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(
        init,
        payer = authority,
        space = 8 + Post::MAX_SIZE,
        seeds = [b"post", user_profile.key().as_ref(), &user_profile.post_count.to_le_bytes()],
        bump
    )]
    pub post: Account<'info, Post>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePost<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"user_profile", user_profile.authority.as_ref()],
        bump = user_profile.bump,
        has_one = authority @ BlogError::Unauthorized
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(
        mut,
        seeds = [b"post", user_profile.key().as_ref(), &post.post_id.to_le_bytes()],
        bump = post.bump,
        has_one = authority @ BlogError::Unauthorized,
        has_one = user_profile @ BlogError::Unauthorized
    )]
    pub post: Account<'info, Post>,
}

#[derive(Accounts)]
pub struct DeletePost<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"user_profile", user_profile.authority.as_ref()],
        bump = user_profile.bump,
        has_one = authority @ BlogError::Unauthorized
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(
        mut,
        close = authority,
        seeds = [b"post", user_profile.key().as_ref(), &post.post_id.to_le_bytes()],
        bump = post.bump,
        has_one = authority @ BlogError::Unauthorized,
        has_one = user_profile @ BlogError::Unauthorized
    )]
    pub post: Account<'info, Post>,
}

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub handle: String,
    pub post_count: u64,
    pub bump: u8,
}

impl UserProfile {
    // Discriminator (8) handled by Anchor; compute rest
    pub const MAX_SIZE: usize = 32 // authority
        + 4 + MAX_HANDLE_LEN // handle vec prefix + bytes
        + 8 // post_count
        + 1; // bump
}

#[account]
pub struct Post {
    pub authority: Pubkey,
    pub user_profile: Pubkey,
    pub post_id: u64,
    pub title: String,
    pub content: String,
    pub bump: u8,
}

impl Post {
    pub const MAX_SIZE: usize = 32 // authority
        + 32 // user_profile
        + 8 // post_id
        + (4 + MAX_TITLE_LEN) // title
        + (4 + MAX_CONTENT_LEN) // content
        + 1; // bump
}

#[error_code]
pub enum BlogError {
    #[msg("Handle exceeds maximum length")] 
    HandleTooLong,
    #[msg("Title exceeds maximum length")]
    TitleTooLong,
    #[msg("Content exceeds maximum length")]
    ContentTooLong,
    #[msg("Operation not authorized")]
    Unauthorized,
    #[msg("Arithmetic overflow occurred")]
    Overflow,
}
