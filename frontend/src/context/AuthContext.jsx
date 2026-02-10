import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    GoogleAuthProvider, 
    signInWithPopup 
} from 'firebase/auth';
import { app } from '../lib/firebase'; // Make sure this path is correct

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth(app);

    // 🔥 LOGIN FUNCTION
    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            // Login සාර්ථකයි! (Backend sync එක පස්සේ බලාගමු)
            return result.user;
        } catch (error) {
            console.error("Google Sign In Error:", error);
            throw error;
        }
    };

    // 🔥 LOGOUT FUNCTION
    const logout = () => signOut(auth);

    // 🔥 AUTH STATE LISTENER
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, [auth]);

    // Values to export
    const value = {
        user,
        signInWithGoogle, // ✅ මේක අනිවාර්යයෙන් තියෙන්න ඕනේ Navbar එකට
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};