# Frontend Setup Guide for GitHub Repository

This guide will help you copy the extracted frontend code to your GitHub repository.

## 📋 Prerequisites

- Your GitHub repository should have a `frontend/` folder
- Git installed on your machine
- Node.js 16+ installed

## 🚀 Step-by-Step Setup

### Step 1: Copy Files to Your GitHub Repo

**Option A: Using Terminal (macOS/Linux)**

```bash
# Navigate to your GitHub repo
cd /path/to/your/github/repo

# Create frontend directory if it doesn't exist
mkdir -p frontend

# Copy all files from the extracted Base44 project
# Replace /path/to/mira-your-cosmic-companion-4b999422 with the actual path
cp -r /path/to/mira-your-cosmic-companion-4b999422/* frontend/

# Copy hidden files (like .env.example)
cp -r /path/to/mira-your-cosmic-companion-4b999422/.* frontend/ 2>/dev/null || true
```

**Option B: Manual Copy (All Operating Systems)**

1. Open your file explorer/finder
2. Navigate to the extracted Base44 project folder
3. Select all files and folders
4. Copy them
5. Navigate to your GitHub repo's `frontend/` folder
6. Paste the files

### Step 2: Setup Environment Variables

```bash
# Navigate to your frontend folder
cd frontend

# Copy the example environment file
cp .env.example .env

# Edit .env and update the backend URL
# Use your preferred text editor (nano, vim, VSCode, etc.)
nano .env
```

Update the `.env` file with your AWS backend URL:
```env
VITE_API_BASE_URL=https://your-aws-backend.com/api
```

For local development with your teammate:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Step 3: Install Dependencies

```bash
# Make sure you're in the frontend directory
cd frontend

# Install all npm packages
npm install
```

This will install all the required dependencies listed in `package.json`.

### Step 4: Test the Setup

```bash
# Start the development server
npm run dev
```

The frontend should start at `http://localhost:5173`

**Note:** The app won't fully work yet until your backend teammate implements the API endpoints. See `API_DOCUMENTATION.md` for what needs to be implemented.

### Step 5: Commit to GitHub

```bash
# Make sure you're in your repo root
cd /path/to/your/github/repo

# Add the frontend files
git add frontend/

# Commit the changes
git commit -m "Add MIRA frontend extracted from Base44"

# Push to GitHub
git push origin main
```

**Important:** Make sure your `.gitignore` includes:
```
node_modules/
dist/
.env
.env.local
```

## 📁 Expected Repository Structure

After setup, your GitHub repository should look like this:

```
your-github-repo/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.js
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   ├── .env (don't commit this!)
│   ├── README.md
│   ├── API_DOCUMENTATION.md
│   └── FRONTEND_SETUP_GUIDE.md
├── backend/
│   └── (your teammate's work)
└── .gitignore
```

## 🤝 Coordinating with Your Backend Teammate

### 1. Share Documentation

Make sure your backend teammate has access to:
- `API_DOCUMENTATION.md` - Complete API specification
- The `.env` file configuration (tell them what URL they should provide)

### 2. Backend Development

Your teammate needs to implement:
- ✅ Authentication endpoints (login, signup, me)
- ✅ User profile CRUD endpoints
- ✅ Conversation management endpoints
- ✅ Message handling with AI integration
- ✅ WebSocket server for real-time updates
- ✅ CORS configuration

### 3. Local Development Setup

For local development while your teammate builds the backend:

**Frontend (your machine):**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Backend (teammate's machine or yours):**
```bash
cd backend
# Whatever command they use to start the backend
# Should run on http://localhost:3000
```

Update your `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### 4. Testing API Integration

Once the backend is ready, test the integration:

1. Start the backend server
2. Start the frontend dev server
3. Open `http://localhost:5173` in your browser
4. Test the following flow:
   - Landing page loads
   - Sign up / Login works
   - Profile creation works
   - Chat interface loads
   - Messages can be sent and received

## 🐛 Common Issues and Solutions

### Issue: "Cannot connect to backend"

**Solution:**
1. Check if backend is running
2. Verify `VITE_API_BASE_URL` in `.env`
3. Check CORS settings on backend
4. Look for errors in browser console

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "WebSocket connection failed"

**Solution:**
1. Verify WebSocket is implemented on backend
2. Check firewall settings
3. For HTTPS frontend, backend must use WSS (WebSocket Secure)

### Issue: Changes to .env not reflecting

**Solution:**
1. Stop the dev server (Ctrl+C)
2. Restart with `npm run dev`
3. Environment variables are loaded at build time

## 🚀 Deployment

### Frontend Deployment Options

1. **Vercel** (Recommended for React/Vite)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Connect your GitHub repo
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variable: `VITE_API_BASE_URL`

3. **AWS S3 + CloudFront**
   - Build: `npm run build`
   - Upload `dist/` contents to S3 bucket
   - Setup CloudFront distribution

4. **AWS Amplify**
   - Connect your GitHub repo
   - Amplify will auto-detect Vite config
   - Add environment variables in Amplify console

### Production Environment Variables

In your production environment, set:
```env
VITE_API_BASE_URL=https://api.your-production-domain.com/api
```

## ✅ Verification Checklist

Before considering the setup complete:

- [ ] All files copied to `frontend/` folder
- [ ] `.env` file created with backend URL
- [ ] Dependencies installed (`node_modules/` exists)
- [ ] Dev server starts without errors
- [ ] Frontend is committed to GitHub
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `.env`
- [ ] Backend teammate has `API_DOCUMENTATION.md`
- [ ] You can access `http://localhost:5173`

## 📞 Getting Help

If you encounter issues:

1. Check the browser console for errors (F12)
2. Check the terminal for build errors
3. Review `README.md` for troubleshooting tips
4. Review `API_DOCUMENTATION.md` for API specs
5. Ensure Node.js version is 16 or higher: `node --version`

## 🎉 Success!

Once everything is set up, you should have:
- ✅ Clean frontend code in your GitHub repo
- ✅ No Base44 dependencies
- ✅ Working dev environment
- ✅ Documentation for backend team
- ✅ Environment configuration ready

Your teammate can now work on the backend independently, using the API documentation as a specification!

