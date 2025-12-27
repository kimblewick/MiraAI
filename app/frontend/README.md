# MIRA - Your Cosmic Companion (Frontend)

A beautiful, modern React frontend for MIRA, an AI-powered astrology companion application.

## 🚀 Tech Stack

- **React** 18.2.0
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide React** - Beautiful icons
- **Framer Motion** - Smooth animations

## 📁 Project Structure

```
src/
├── api/
│   └── apiClient.js          # Abstracted API client for AWS backend
├── components/
│   ├── chat/                 # Chat-related components
│   │   ├── ChatArea.jsx
│   │   ├── ChatSidebar.jsx
│   │   ├── MessageBubble.jsx
│   │   └── VisualizationArea.jsx
│   ├── onboarding/
│   │   └── ProfileForm.jsx   # User profile form
│   └── ui/                   # shadcn/ui components
├── pages/
│   ├── Landing.jsx           # Landing page
│   ├── Onboarding.jsx        # User onboarding
│   ├── FirstChat.jsx         # First-time chat experience
│   ├── Chat.jsx              # Main chat interface
│   └── Profile.jsx           # User profile management
├── hooks/                    # Custom React hooks
├── lib/                      # Utility functions
└── utils/                    # Helper functions
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Your AWS backend should be running and accessible

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in the required values:
   ```env
   # API Gateway endpoint
   VITE_API_BASE_URL=http://localhost:3000/api
   
   # AWS Cognito configuration
   VITE_AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
   VITE_AWS_COGNITO_CLIENT_ID=your-app-client-id
   
   # AWS Region
   VITE_AWS_REGION=us-east-1
   ```
   
   📖 **For detailed setup instructions, see [ENV_SETUP.md](./ENV_SETUP.md)**

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

To preview the production build:
```bash
npm run preview
```

## 🔗 Backend Integration

The frontend expects your AWS backend to implement specific API endpoints. See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for the complete API specification.

### Key Integration Points

1. **Authentication:** JWT token-based auth stored in localStorage
2. **API Client:** Located at `src/api/apiClient.js` - handles all backend requests
3. **WebSocket:** Real-time chat updates via WebSocket connection
4. **Environment Config:** Backend URL configured via `VITE_API_BASE_URL`

## 📦 Deploying to Your GitHub Repo

To copy this frontend to your GitHub repository:

1. **Copy all frontend files to your repo:**
   ```bash
   # From this directory, copy to your GitHub repo's frontend folder
   cp -r . /path/to/your-github-repo/frontend/
   
   # Or if you're already in your repo:
   # Copy files from the extracted folder to your frontend directory
   ```

2. **Update the `.gitignore`:**
   
   Make sure these are in your `.gitignore`:
   ```
   node_modules/
   dist/
   .env
   .env.local
   ```

3. **Install dependencies in your repo:**
   ```bash
   cd /path/to/your-github-repo/frontend
   npm install
   ```

4. **Configure your environment:**
   - Create `.env` with your AWS backend URL
   - Update any other configuration as needed

5. **Test the setup:**
   ```bash
   npm run dev
   ```

## 🎨 Customization

### Styling

- The app uses Tailwind CSS with a custom purple/indigo cosmic theme
- Global styles are in `src/index.css` and `src/App.css`
- Component-specific styles use Tailwind utility classes
- shadcn/ui components can be customized in `src/components/ui/`

### Themes

The app uses a cosmic purple/indigo gradient theme. To customize:

1. Edit `tailwind.config.js` to change colors
2. Update gradient classes in components (e.g., `from-purple-500 to-indigo-600`)
3. Modify the background animations in page components

### Routes

Routes are defined in `src/pages/index.jsx`. To add new routes:

1. Create a new page component in `src/pages/`
2. Add the route in `src/pages/index.jsx`
3. Update the `createPageUrl()` utility if needed

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- Use functional React components with hooks
- Follow the existing component structure
- Use Tailwind CSS for styling
- Keep components modular and reusable

## 🐛 Troubleshooting

### API Connection Issues

If the frontend can't connect to your backend:

1. Check `VITE_API_BASE_URL` in `.env`
2. Verify CORS is configured on your backend
3. Check browser console for specific error messages
4. Ensure your backend is running and accessible

### WebSocket Connection Issues

WebSocket URL is derived from `VITE_API_BASE_URL` by replacing `http` with `ws`:
- `http://localhost:3000/api` → `ws://localhost:3000/api`
- `https://api.example.com/api` → `wss://api.example.com/api`

### Build Issues

If you encounter build errors:

1. Delete `node_modules/` and `package-lock.json`
2. Run `npm install` again
3. Make sure you're using Node.js 16+

## ✅ Testing & Validation

This frontend has been **fully tested and validated**:
- ✅ All dependencies install successfully (0 vulnerabilities)
- ✅ Dev server runs perfectly
- ✅ Production build completes successfully
- ✅ No critical errors or issues
- ✅ **Works without backend** (Development Mode)

See [`TEST_RESULTS.md`](./TEST_RESULTS.md) for complete test report.

## 🎯 Development Mode (No Backend Required!)

**NEW:** The frontend now works **without a backend** for testing and development!

- ✅ Test all pages and UI flows
- ✅ Fill out forms and navigate
- ✅ No redirect loops or crashes
- ✅ Data saved temporarily in localStorage
- ✅ Clear alerts when backend actions needed

See [`DEVELOPMENT_MODE.md`](./DEVELOPMENT_MODE.md) for details.

**When backend is ready:** Just update `.env` and everything connects automatically!

## 📝 Notes

- **No Base44 Dependencies:** All Base44 backend code has been removed
- **Custom API Client:** The app uses a custom API client that works with any backend
- **Environment Variables:** Must start with `VITE_` to be available in the app
- **Authentication:** Token stored in localStorage as `auth_token`
- **Production Ready:** Fully tested and ready for deployment

## 🤝 Working with Your Backend Team

Share the following with your backend team:

1. **API Documentation:** [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)
2. **Environment Variables:** Let them know what URL to provide for `VITE_API_BASE_URL`
3. **WebSocket Requirements:** Real-time chat updates need WebSocket support
4. **CORS Configuration:** Backend must allow requests from your frontend domain

## 📄 License

This project is private and for internal use.

## 🆘 Support

For issues or questions:
- Check the `API_DOCUMENTATION.md` for backend integration details
- Review the component code for implementation examples
- Check browser console for error messages
