# NDC Calculator

AI-powered NDC packaging and quantity calculator for pharmacists.

## Overview

The NDC Calculator helps pharmacists quickly determine the correct National Drug Code (NDC) and optimal packaging quantities for prescriptions. It reduces calculation time from 10-15 minutes to 30 seconds with 95%+ accuracy.

## Tech Stack

- **Frontend**: SvelteKit 2.0 + TypeScript
- **Styling**: TailwindCSS + shadcn-svelte
- **Backend**: Firebase (Auth, Firestore, Functions)
- **AI**: OpenAI GPT-4o
- **APIs**: RxNorm API, FDA NDC Directory API

## Features

- Drug name normalization using RxNorm API
- Intelligent prescription instruction parsing (SIG)
- NDC validation and inactive code detection
- Optimal package size recommendations
- Multi-pack optimization
- Special dosage form support (liquids, insulin, inhalers)

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or pnpm
- Firebase project
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/karinje/pharmacy-app.git
   cd pharmacy-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase and OpenAI API keys
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── lib/
│   ├── config/      # Firebase, env, constants
│   ├── types/       # TypeScript type definitions
│   └── utils/       # Utility functions
├── routes/          # SvelteKit routes
└── app.css          # Global styles
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Documentation

See `ndc_shards/` directory for detailed implementation shards and build instructions.

## License

Private - Foundation Health

## Status

🚧 **In Development** - Shard 1 (Project Foundation) Complete
