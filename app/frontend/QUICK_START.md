# Quick Start Guide

## 🎯 Get Your Frontend Running in 5 Minutes

### Step 1: Copy Files to Your GitHub Repo

Copy everything from this folder to your `github/app/frontend` directory:

```bash
# Option 1: Using terminal
cp -r /path/to/mira-your-cosmic-companion-4b999422/* /path/to/your/github/app/frontend/

# Option 2: Manual copy
# Just drag and drop all files to your frontend folder
```

### Step 2: Setup Environment

Navigate to your frontend folder and create a `.env` file:

```bash
cd /path/to/your/github/app/frontend

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env
```

Or manually create `.env` with this content:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## ✅ That's It!

The frontend is now running. It won't fully work until your teammate implements the backend API.

## 📚 Next Steps

1. **Share with Backend Team:** Give them `API_DOCUMENTATION.md`
2. **Read Full Docs:** Check `README.md` for details
3. **Setup Guide:** See `FRONTEND_SETUP_GUIDE.md` for detailed instructions
4. **Environment Setup:** See `ENV_SETUP.md` for environment variable options

## 🔗 Important Files

- `API_DOCUMENTATION.md` - Complete API spec for backend team
- `README.md` - Full frontend documentation
- `FRONTEND_SETUP_GUIDE.md` - Detailed setup instructions
- `ENV_SETUP.md` - Environment variable configuration
- `src/api/apiClient.js` - API client that connects to your backend

## ⚡ Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🐛 Troubleshooting

**Can't connect to backend?**
- Make sure `VITE_API_BASE_URL` in `.env` is correct
- Verify backend is running
- Check CORS settings

**Build errors?**
- Delete `node_modules/` and `package-lock.json`
- Run `npm install` again

**Changes not showing?**
- Restart dev server (Ctrl+C, then `npm run dev`)
- Clear browser cache

## 📦 Repository Structure

```
github/app/
├── frontend/          (this code)
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── ...
└── backend/          (your teammate's work)
    └── ...
```

