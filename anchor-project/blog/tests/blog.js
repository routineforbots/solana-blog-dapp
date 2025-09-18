const anchor = require("@coral-xyz/anchor");
const { PublicKey, SystemProgram } = anchor.web3;

describe("blog", () => {
  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const program = anchor.workspace.Blog || anchor.workspace.blog;

  const getUserProfilePda = (authority) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("user_profile"), authority.toBuffer()],
      program.programId
    )[0];

  const getPostPda = (userProfile, postIdBn) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("post"),
        userProfile.toBuffer(),
        Buffer.from(new Uint8Array(postIdBn.toArrayLike(Buffer, "le", 8))),
      ],
      program.programId
    )[0];

  it("Initialize user, set handle, create post (happy path)", async () => {
    const authority = provider.wallet.publicKey;
    const userProfile = getUserProfilePda(authority);

    await program.methods
      .initializeUser()
      .accounts({
        authority,
        userProfile,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .setHandle("alice")
      .accounts({ authority, userProfile })
      .rpc();

    const postId = new anchor.BN(0);
    const post = getPostPda(userProfile, postId);

    await program.methods
      .createPost("Hello", "First post content")
      .accounts({
        authority,
        userProfile,
        post,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const profileAcc = await program.account.userProfile.fetch(userProfile);
    const postAcc = await program.account.post.fetch(post);

    if (profileAcc.handle !== "alice") throw new Error("Handle mismatch");
    if (!postAcc.title || postAcc.title !== "Hello")
      throw new Error("Post title mismatch");
  });

  it("Update and delete post (happy path)", async () => {
    const authority = provider.wallet.publicKey;
    const userProfile = getUserProfilePda(authority);

    // existing post 0
    const post0 = getPostPda(userProfile, new anchor.BN(0));

    await program.methods
      .updatePost("Updated Title", "Updated Content")
      .accounts({ authority, userProfile, post: post0 })
      .rpc();

    const updated = await program.account.post.fetch(post0);
    if (updated.title !== "Updated Title") throw new Error("Update failed");

    await program.methods
      .deletePost()
      .accounts({ authority, userProfile, post: post0 })
      .rpc();

    // Ensure deleted
    let exists = true;
    try {
      await program.account.post.fetch(post0);
    } catch (_) {
      exists = false;
    }
    if (exists) throw new Error("Delete failed");
  });

  it("Unhappy: non-authority cannot set handle or post", async () => {
    const authority = provider.wallet.publicKey;
    const userProfile = getUserProfilePda(authority);

    // Ensure profile exists
    try {
      await program.methods
        .initializeUser()
        .accounts({
          authority,
          userProfile,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e) {}

    // Create a random other signer
    const other = anchor.web3.Keypair.generate();

    // Airdrop SOL to other on localnet
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(other.publicKey, 2e9)
    );

    // Try setHandle with wrong authority
    let failed = false;
    try {
      await program.methods
        .setHandle("bob")
        .accounts({ authority: other.publicKey, userProfile })
        .signers([other])
        .rpc();
    } catch (e) {
      failed = true;
    }
    if (!failed) throw new Error("Expected setHandle by non-authority to fail");

    // Try createPost with wrong authority
    const postId = new anchor.BN(1);
    const post = getPostPda(userProfile, postId);
    failed = false;
    try {
      await program.methods
        .createPost("Hi", "Not allowed")
        .accounts({
          authority: other.publicKey,
          userProfile,
          post,
          systemProgram: SystemProgram.programId,
        })
        .signers([other])
        .rpc();
    } catch (e) {
      failed = true;
    }
    if (!failed)
      throw new Error("Expected createPost by non-authority to fail");

    // Try update/delete with wrong authority
    const post0 = getPostPda(userProfile, new anchor.BN(0));

    failed = false;
    try {
      await program.methods
        .updatePost("X", "Y")
        .accounts({ authority: other.publicKey, userProfile, post: post0 })
        .signers([other])
        .rpc();
    } catch (_) {
      failed = true;
    }
    if (!failed) throw new Error("Expected update by non-authority to fail");

    failed = false;
    try {
      await program.methods
        .deletePost()
        .accounts({ authority: other.publicKey, userProfile, post: post0 })
        .signers([other])
        .rpc();
    } catch (_) {
      failed = true;
    }
    if (!failed) throw new Error("Expected delete by non-authority to fail");
  });

  it("Profile picture functionality (happy path)", async () => {
    const authority = provider.wallet.publicKey;
    const userProfile = getUserProfilePda(authority);

    // Ensure profile exists
    try {
      await program.methods
        .initializeUser()
        .accounts({
          authority,
          userProfile,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e) {}

    // Set a profile picture (base64 encoded small image)
    const testPicture =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    await program.methods
      .setProfilePicture(testPicture)
      .accounts({ authority, userProfile })
      .rpc();

    const profileAcc = await program.account.userProfile.fetch(userProfile);
    if (profileAcc.profilePicture !== testPicture) {
      throw new Error("Profile picture mismatch");
    }
  });

  it("Profile picture functionality (unhappy path)", async () => {
    const authority = provider.wallet.publicKey;
    const userProfile = getUserProfilePda(authority);

    // Ensure profile exists
    try {
      await program.methods
        .initializeUser()
        .accounts({
          authority,
          userProfile,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } catch (e) {}

    // Create a random other signer
    const other = anchor.web3.Keypair.generate();

    // Airdrop SOL to other on localnet
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(other.publicKey, 2e9)
    );

    // Try setProfilePicture with wrong authority
    const testPicture =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    let failed = false;
    try {
      await program.methods
        .setProfilePicture(testPicture)
        .accounts({ authority: other.publicKey, userProfile })
        .signers([other])
        .rpc();
    } catch (e) {
      failed = true;
    }
    if (!failed)
      throw new Error("Expected setProfilePicture by non-authority to fail");

    // Try setProfilePicture with too long picture
    const longPicture = "a".repeat(1025); // Exceeds MAX_PROFILE_PICTURE_LEN

    failed = false;
    try {
      await program.methods
        .setProfilePicture(longPicture)
        .accounts({ authority, userProfile })
        .rpc();
    } catch (e) {
      failed = true;
    }
    if (!failed)
      throw new Error(
        "Expected setProfilePicture with too long picture to fail"
      );
  });
});
