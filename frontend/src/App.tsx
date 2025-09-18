import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { AnchorProvider, BN, Program, BorshAccountsCoder, BorshInstructionCoder, type Idl, type Provider } from '@coral-xyz/anchor';
import { Connection, clusterApiUrl, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import localIdl from './idl/blog.json';

// Extend Window type for Phantom
declare global {
	interface Window {
		solana?: any;
		phantom?: { solana?: any };
	}
}

// Program ID from deployment
const PROGRAM_ID = new PublicKey('9uTQy7AX7qd9xHDzcbK1mkraGPAMT7G3o1h2Ei8i4rAZ');

function App() {
	const [connection] = useState(() => new Connection(clusterApiUrl('devnet'), 'confirmed'));
	const [wallet, setWallet] = useState<any | null>(null);
	const [pubkey, setPubkey] = useState<PublicKey | null>(null);
	const [idl, setIdl] = useState<Idl | null>(null);
	const [handleInput, setHandleInput] = useState('');
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [updateId, setUpdateId] = useState('');
	const [updateTitle, setUpdateTitle] = useState('');
	const [updateContent, setUpdateContent] = useState('');
	const [deleteId, setDeleteId] = useState('');
	const [status, setStatus] = useState('');
	const [posts, setPosts] = useState<Array<{ id: string; title: string; content: string }>>([]);

	useEffect(() => {
		const detect = () => {
			const provider = window?.phantom?.solana ?? window?.solana;
			if (provider?.isPhantom) setWallet(provider);
		};
		detect();
		window.addEventListener('phantom#initialized', detect as any, { once: true });
		return () => window.removeEventListener('phantom#initialized', detect as any);
	}, []);

	const provider: Provider | null = useMemo(() => {
		const detected = wallet ?? window?.phantom?.solana ?? window?.solana;
		if (!detected) return null;
		return new AnchorProvider(connection, detected as any, { commitment: 'confirmed' });
	}, [connection, wallet]);

	function normalizeIdl(input: any): Idl {
		if (!input?.accounts || !input?.types) return input as Idl;
		const nameToType: Record<string, any> = {};
		for (const t of input.types) {
			if (t?.name && t?.type) nameToType[t.name] = t.type;
		}
		const accounts = input.accounts.map((a: any) => {
			if (!a?.type && nameToType[a?.name]) {
				return { ...a, type: nameToType[a.name] };
			}
			return a;
		});
		return { ...input, accounts } as Idl;
	}

	// Fetch IDL with timeout, fallback to local bundled IDL
	useEffect(() => {
		(async () => {
			if (!provider) return;
			try {
				const withTimeout = (p: Promise<any>, ms: number) => new Promise<any>((resolve, reject) => {
					const t = setTimeout(() => reject(new Error('idl-timeout')), ms);
					p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
				});
				const fetched = await withTimeout(Program.fetchIdl(PROGRAM_ID, provider) as Promise<Idl | null>, 2500);
				if (fetched && Array.isArray((fetched as any).accounts) && (fetched as any).accounts.length > 0) {
					setIdl(normalizeIdl(fetched) as Idl);
					setStatus('');
					return;
				}
				setIdl(normalizeIdl(localIdl) as unknown as Idl);
				setStatus('Using bundled IDL.');
			} catch (e) {
				console.warn('IDL fetch failed, using bundled IDL instead:', e);
				setIdl(normalizeIdl(localIdl) as unknown as Idl);
				setStatus('Using bundled IDL.');
			}
		})();
	}, [provider]);

	const coder = useMemo(() => {
		if (!idl) return null;
		try { return new BorshAccountsCoder(idl as any); } catch { return null; }
	}, [idl]);

	const program = useMemo(() => {
		if (!provider || !idl) return null;
		// Prevent AccountClient construction issues by omitting accounts namespace
		const idlForProgram: any = { ...(idl as any), accounts: [] };
		return new (Program as any)(idlForProgram as Idl, PROGRAM_ID, provider as any);
	}, [provider, idl]);

	const connect = useCallback(async () => {
		const provider = window?.phantom?.solana ?? window?.solana;
		if (!provider || !provider.isPhantom) {
			window.open('https://phantom.app/download', '_blank');
			return;
		}
		const res = await provider.connect();
		setWallet(provider);
		setPubkey(new PublicKey(res.publicKey));
	}, []);

	const getUserProfilePda = useCallback((authority: PublicKey) => {
		return PublicKey.findProgramAddressSync([Buffer.from('user_profile'), authority.toBuffer()], PROGRAM_ID)[0];
	}, []);

	const getPostPda = useCallback((userProfile: PublicKey, postId: BN) => {
		const le = Buffer.alloc(8);
		le.writeBigUInt64LE(BigInt(postId.toString()));
		return PublicKey.findProgramAddressSync([Buffer.from('post'), userProfile.toBuffer(), le], PROGRAM_ID)[0];
	}, []);

	const initializeUser = useCallback(async () => {
		if (!provider || !idl || !pubkey) return;
		setStatus('Initializing user...');
		try {
			const userProfile = getUserProfilePda(pubkey);
			// Pre-check: if account already exists, skip and inform the user
			const existing = await connection.getAccountInfo(userProfile);
			if (existing) {
				setStatus('User already initialized.');
				return;
			}
			const ic = new BorshInstructionCoder(idl as any);
			const data = ic.encode('initialize_user', {} as any);
			const keys = [
				{ pubkey, isSigner: true, isWritable: true },
				{ pubkey: userProfile, isSigner: false, isWritable: true },
				{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
			];
			const ix = new TransactionInstruction({ programId: PROGRAM_ID, keys, data });
			const tx = new Transaction().add(ix);
			const sig = await (provider as any).sendAndConfirm(tx, [], { commitment: 'confirmed', preflightCommitment: 'confirmed', timeout: 60000 });
			setStatus(`User initialized. Tx: ${sig}`);
			// Refresh posts (in case they existed from earlier testing)
			await loadMyPosts();
		} catch (e:any) {
			console.error('initializeUser failed', e);
			const logs = e?.logs ? ` Logs: ${JSON.stringify(e.logs)}` : '';
			setStatus(`Init failed: ${e?.message || e}${logs}`);
		}
	}, [provider, idl, pubkey, getUserProfilePda, connection]);

	const setHandle = useCallback(async () => {
		if (!provider || !idl || !pubkey) return;
		setStatus('Setting handle...');
		try {
			const userProfile = getUserProfilePda(pubkey);
			const ic = new BorshInstructionCoder(idl as any);
			const data = ic.encode('set_handle', { new_handle: handleInput } as any);
			const keys = [
				{ pubkey, isSigner: true, isWritable: true },
				{ pubkey: userProfile, isSigner: false, isWritable: true },
			];
			const ix = new TransactionInstruction({ programId: PROGRAM_ID, keys, data });
			const tx = new Transaction().add(ix);
			const sig = await (provider as any).sendAndConfirm(tx, []);
			setStatus(`Handle set. Tx: ${sig}`);
		} catch (e:any) {
			console.error('setHandle failed', e);
			setStatus(`Set handle failed: ${e?.message || e}`);
		}
	}, [provider, idl, pubkey, handleInput, getUserProfilePda]);

	const loadMyPosts = useCallback(async () => {
		if (!program || !coder || !pubkey) return;
		setStatus('Loading posts...');
		try {
			const userProfile = getUserProfilePda(pubkey);
			const results = await connection.getProgramAccounts(PROGRAM_ID, {
				filters: [
					{ memcmp: { offset: 8 + 32, bytes: userProfile.toBase58() } },
				],
			});
			let accounts = results;
			if (accounts.length === 0) {
				// Fallback: fetch all and filter client-side (devnet-safe for small data)
				const all = await connection.getProgramAccounts(PROGRAM_ID);
				accounts = all.filter((acc: any) => {
					try {
						const d: any = coder.decode('Post', acc.account.data);
						return (d.user_profile?.toBase58?.() || d.user_profile?.toString?.() || String(d.user_profile)) === userProfile.toBase58();
					} catch {
						return false;
					}
				});
			}
			const decoded = accounts.map((acc: any) => {
				const d: any = coder.decode('Post', acc.account.data);
				return { id: String(d.post_id ?? d.postId), title: d.title, content: d.content };
			});
			decoded.sort((a, b) => Number(b.id) - Number(a.id));
			setPosts(decoded);
			setStatus(`Loaded ${decoded.length} posts.`);
		} catch (e:any) {
			console.error('loadMyPosts failed', e);
			setStatus(`Load posts failed: ${e?.message || e}`);
		}
	}, [program, coder, pubkey, getUserProfilePda, connection]);

	const createPost = useCallback(async () => {
		if (!provider || !idl || !pubkey || !title || !content) return;
		setStatus('Creating post...');
		try {
			const userProfile = getUserProfilePda(pubkey);
			if (!coder) throw new Error('coder-not-ready');
			const accInfo = await connection.getAccountInfo(userProfile);
			if (!accInfo) throw new Error('profile-not-found');
			const profileAcc: any = coder.decode('UserProfile', accInfo.data);
			const postId = new BN(profileAcc.post_count ?? profileAcc.postCount);
			const post = getPostPda(userProfile, postId);

			const ic = new BorshInstructionCoder(idl as any);
			const data = ic.encode('create_post', { title, content } as any);
			const keys = [
				{ pubkey, isSigner: true, isWritable: true },
				{ pubkey: userProfile, isSigner: false, isWritable: true },
				{ pubkey: post, isSigner: false, isWritable: true },
				{ pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
			];
			const ix = new TransactionInstruction({ programId: PROGRAM_ID, keys, data });
			const tx = new Transaction().add(ix);
			
			// Send transaction with 60-second timeout
			const sig = await (provider as any).sendAndConfirm(tx, [], {
				commitment: 'confirmed',
				preflightCommitment: 'confirmed',
				timeout: 60000
			});
			
			setStatus(`Post created. Tx: ${sig}`);
			setTitle('');
			setContent('');
			await loadMyPosts();
		} catch (e:any) {
			console.error('createPost failed', e);
			const logs = e?.logs ? ` Logs: ${JSON.stringify(e.logs)}` : '';
			setStatus(`Create post failed: ${e?.message || e}${logs}`);
		}
	}, [provider, idl, pubkey, title, content, getUserProfilePda, getPostPda, coder, connection, loadMyPosts]);

	const updatePost = useCallback(async () => {
		if (!provider || !idl || !pubkey) return;
		setStatus('Updating post...');
		try {
			const userProfile = getUserProfilePda(pubkey);
			const postId = new BN(updateId);
			const post = getPostPda(userProfile, postId);

			const ic = new BorshInstructionCoder(idl as any);
			const data = ic.encode('update_post', { new_title: updateTitle, new_content: updateContent } as any);
			const keys = [
				{ pubkey, isSigner: true, isWritable: true },
				{ pubkey: userProfile, isSigner: false, isWritable: false },
				{ pubkey: post, isSigner: false, isWritable: true },
			];
			const ix = new TransactionInstruction({ programId: PROGRAM_ID, keys, data });
			const tx = new Transaction().add(ix);
			const sig = await (provider as any).sendAndConfirm(tx, []);
			setStatus(`Post updated. Tx: ${sig}`);
			setUpdateId('');
			setUpdateTitle('');
			setUpdateContent('');
			await loadMyPosts();
		} catch (e:any) {
			console.error('updatePost failed', e);
			setStatus(`Update failed: ${e?.message || e}`);
		}
	}, [provider, idl, pubkey, updateId, updateTitle, updateContent, getUserProfilePda, getPostPda, loadMyPosts]);

	const deletePost = useCallback(async () => {
		if (!provider || !idl || !pubkey) return;
		setStatus('Deleting post...');
		try {
			const userProfile = getUserProfilePda(pubkey);
			const postId = new BN(deleteId);
			const post = getPostPda(userProfile, postId);

			const ic = new BorshInstructionCoder(idl as any);
			const data = ic.encode('delete_post', {} as any);
			const keys = [
				{ pubkey, isSigner: true, isWritable: true },
				{ pubkey: userProfile, isSigner: false, isWritable: false },
				{ pubkey: post, isSigner: false, isWritable: true },
			];
			const ix = new TransactionInstruction({ programId: PROGRAM_ID, keys, data });
			const tx = new Transaction().add(ix);
			const sig = await (provider as any).sendAndConfirm(tx, []);
			setStatus(`Post deleted. Tx: ${sig}`);
			setDeleteId('');
			await loadMyPosts();
		} catch (e:any) {
			console.error('deletePost failed', e);
			setStatus(`Delete failed: ${e?.message || e}`);
		}
	}, [provider, idl, pubkey, deleteId, getUserProfilePda, getPostPda, loadMyPosts]);

	const canCreate = useMemo(() => !!title && !!content && title.trim().length > 0 && content.trim().length > 0, [title, content]);
	const canUpdate = useMemo(() => !!updateId && (updateTitle.trim().length > 0 || updateContent.trim().length > 0), [updateId, updateTitle, updateContent]);

	return (
		<div className="App">
			<h2>Solana Blog dApp</h2>
			{!pubkey ? (
				<div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
					<button onClick={connect}>Connect Phantom</button>
				</div>
			) : (
				<div>Connected: {pubkey.toBase58()}</div>
			)}

			<div style={{ marginTop: 16 }}>
				<button onClick={initializeUser} disabled={!provider || !idl || !pubkey}>Initialize User</button>
				<button onClick={loadMyPosts} style={{ marginLeft: 8 }} disabled={!program || !pubkey}>Refresh Posts</button>
			</div>

			<div style={{ marginTop: 16 }}>
				<div className="row">
					<input placeholder="@handle" value={handleInput} onChange={e => setHandleInput(e.target.value)} />
					<button onClick={setHandle} disabled={!provider || !idl || !pubkey || !handleInput}>Set Handle</button>
				</div>
			</div>

			<div style={{ marginTop: 16 }}>
				<div className="row">
					<input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
					<textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} />
					<button onClick={createPost} disabled={!provider || !idl || !pubkey || !canCreate}>Create Post</button>
				</div>
			</div>

			<hr />
			<h3>Update Post</h3>
			<div style={{ marginTop: 8 }}>
				<input placeholder="Post ID" value={updateId} onChange={e => setUpdateId(e.target.value)} />
			</div>
			<div style={{ marginTop: 8 }}>
				<input placeholder="New Title" value={updateTitle} onChange={e => setUpdateTitle(e.target.value)} />
			</div>
			<div style={{ marginTop: 8 }}>
				<textarea placeholder="New Content" value={updateContent} onChange={e => setUpdateContent(e.target.value)} />
			</div>
			<div style={{ marginTop: 8 }}>
				<button onClick={updatePost} disabled={!provider || !idl || !pubkey || !canUpdate}>Update</button>
			</div>

			<hr />
			<h3>Delete Post</h3>
			<div style={{ marginTop: 8 }}>
				<input placeholder="Post ID" value={deleteId} onChange={e => setDeleteId(e.target.value)} />
				<button onClick={deletePost} disabled={!provider || !idl || !pubkey || !deleteId}>Delete</button>
			</div>

			<hr />
			<h3>My Posts</h3>
			<ul style={{ textAlign: 'left', maxWidth: 720, margin: '8px auto', padding: 0, listStyle: 'none' }}>
				{posts.map((p, i) => (
					<li key={i} style={{ marginBottom: 12, padding: 12, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
						<div><b>ID:</b> {p.id}</div>
						<div><b>Title:</b> {p.title}</div>
						<div><b>Content:</b> {p.content}</div>
					</li>
				))}
			</ul>

			<div style={{ marginTop: 16, color: '#8ef08e' }}>{status || (!idl ? 'Loading IDL from chain…' : '')}</div>
		</div>
	);
}

export default App;
