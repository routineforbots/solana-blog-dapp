# Solana Blog dApp Frontend

A modern React frontend for the Solana Blog dApp, built with Vite and integrated with Phantom wallet for seamless blockchain interactions.

## Live Demo

**Production URL**: https://frontend-ow4rd3lfk-routineforbots-projects.vercel.app

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Blockchain**: Solana Web3.js
- **Wallet Integration**: Phantom Wallet
- **Styling**: CSS with modern design principles
- **Deployment**: Vercel

## Features

- **Wallet Connection**: Seamless Phantom wallet integration
- **User Profile Management**: Initialize profiles and set custom handles
- **Blog Post CRUD**: Create, read, update, and delete posts
- **Real-time Updates**: UI refreshes after successful blockchain operations
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Responsive Design**: Optimized for all device sizes
- **Transaction Management**: 60-second timeouts for Devnet reliability

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Application styles
│   ├── idl/             # Solana program IDL
│   │   └── blog.json    # Blog program interface definition
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
└── README.md            # This file
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Phantom wallet browser extension
- Solana Devnet SOL (for testing)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd program-routineforbot/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

## 🔗 Configuration

### Solana Network

The app is configured to use **Solana Devnet** by default:

- RPC Endpoint: `https://api.devnet.solana.com`
- Commitment: `confirmed`

### Program ID

The frontend connects to the deployed Solana program:

- **Program ID**: `9uTQy7AX7qd9xHDzcbK1mkraGPAMT7G3o1h2Ei8i4rAZ`

## Usage

### 1. Connect Wallet

- Install Phantom wallet extension
- Click "Connect Wallet" in the app
- Approve the connection

### 2. Initialize Profile

- Click "Initialize User" to create your profile PDA
- This creates your unique user profile on the blockchain

### 3. Set Handle

- Enter a custom username (handle)
- Click "Set Handle" to save it on-chain

### 4. Create Posts

- Enter post title and content
- Click "Create Post" to publish to the blockchain

### 5. Manage Posts

- **Update**: Modify existing posts with new title/content
- **Delete**: Remove posts from the blockchain
- **View**: See all your posts with real-time updates

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking

### Key Components

- **App.tsx**: Main application logic and UI
- **Wallet Integration**: Phantom wallet connection and transaction handling
- **Transaction Management**: Solana transaction building and confirmation
- **Error Handling**: User-friendly error messages and recovery

### State Management

The app uses React hooks for state management:

- `useState` for local component state
- `useCallback` for memoized functions
- `useEffect` for side effects and data fetching
- `useMemo` for computed values

## Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Deploy**

   ```bash
   vercel --prod
   ```

3. **Follow the prompts** to configure your project

### Other Platforms

The app can be deployed to any static hosting platform:

- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**

   - Ensure Phantom wallet is installed and unlocked
   - Check if wallet is connected to Devnet

2. **Transaction Timeout**

   - Devnet can be slow; the app uses 60-second timeouts
   - Check network status at https://status.solana.com

3. **Build Errors**
   - Clear `node_modules` and reinstall dependencies
   - Ensure Node.js version is 16+

### Debug Mode

Enable debug logging in the browser console for detailed transaction information.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Solana School curriculum and follows their licensing terms.

## Links

- **Live App**: https://frontend-ow4rd3lfk-routineforbots-projects.vercel.app
- **Solana Program**: [Anchor Project README](../anchor-project/README.md)
- **Project Description**: [PROJECT_DESCRIPTION.md](../PROJECT_DESCRIPTION.md)
- **Solana School**: https://school.solana.com/
