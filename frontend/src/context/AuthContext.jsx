import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { app } from '../lib/firebase';
import { supabase } from '../lib/supabase'; // 🔥 අලුතින් එකතු කලා

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth(app);

    // 🔥 Generate a random token for the session
    const generateSessionToken = () => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    // 🔥 LOGIN FUNCTION
    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const currentUser = result.user;
            
            // 1. Generate a new token locally
            const newToken = generateSessionToken();
            
            // 2. Save it to LocalStorage
            localStorage.setItem(`myguru_session_token_${currentUser.uid}`, newToken);

            // 🔥 3. Call Backend Endpoint to update DB Securely (Instead of Supabase Direct Call)
            // මෙතනදී අපි frontend එකෙන් Supabase එකට කතා කරන්නේ නෑ.
            // ඒ වෙනුවට අපේ Node.js / FastAPI Backend එකට user id එකයි token එකයි යවනවා.
            try {
                const response = await fetch('https://myguru.lumi-automation.com/brain/update_session_and_credits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: currentUser.uid,
                        session_token: newToken
                    })
                });

                if (!response.ok) throw new Error("Backend Update Failed");
                const data = await response.ok;
                console.log("✅ Session updated securely via backend");

            } catch (backendErr) {
                console.error("❌ Secure Session Update Error:", backendErr);
                // Option: Logout if backend fails, or just alert user
                // await logout(); navigate('/'); return;
            }

            return currentUser;
        } catch (error) {
            console.error("Google Sign In Error:", error);
            throw error;
        }
    };

    // 🔥 LOGOUT FUNCTION
    const logout = async () => {
        if (user) {
            localStorage.removeItem(`myguru_session_token_${user.uid}`);
        }
        await signOut(auth);
    };

    // 🔥 AUTH STATE LISTENER
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, [auth]);

    const value = {
        user,
        signInWithGoogle, 
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};