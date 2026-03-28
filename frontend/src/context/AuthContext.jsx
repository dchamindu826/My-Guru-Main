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
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const currentUser = result.user;
            
            // 1. Create a new token
            const newToken = generateSessionToken();
            
            // 2. Save it locally
            localStorage.setItem(`myguru_session_token_${currentUser.uid}`, newToken);

            // 3. Save it to Database (Supabase)
            const { error } = await supabase
                .from('profiles')
                .upsert({ 
                    id: currentUser.uid, 
                    current_session_token: newToken,
                    last_reset_date: new Date().toISOString().split('T')[0] // Just to ensure profile exists
                }, { onConflict: 'id' });

            if (error) console.error("Error saving session token:", error);
            
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