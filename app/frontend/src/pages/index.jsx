import Layout from "./Layout.jsx";

import Landing from "./Landing";

import Onboarding from "./Onboarding";

import FirstChat from "./FirstChat";

import Chat from "./Chat";

import Profile from "./Profile";

import Callback from "./Callback";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const PAGES = {
    
    Landing: Landing,
    
    Onboarding: Onboarding,
    
    FirstChat: FirstChat,
    
    Chat: Chat,
    
    Profile: Profile,
    
    Callback: Callback,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Landing />} />
                
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                
                <Route path="/FirstChat" element={<ProtectedRoute><FirstChat /></ProtectedRoute>} />
                
                <Route path="/Chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                
                <Route path="/Profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                
                <Route path="/Callback" element={<Callback />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <AuthProvider>
                <PagesContent />
            </AuthProvider>
        </Router>
    );
}