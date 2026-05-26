import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useOrganization, useAuth as useClerkAuth } from '@clerk/clerk-react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded: isUserLoaded, isSignedIn, user: clerkUser } = useUser();
  const { organization } = useOrganization();
  const { signOut } = useClerkAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // When Clerk user and organization are loaded, sync with our backend
  useEffect(() => {
    if (!isUserLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (!organization) {
      // User is signed in but hasn't selected an org
      setUser(null);
      setLoading(false);
      return;
    }

    // Fetch user profile from our backend (which auto-provisions on first access)
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/users/me');
        setUser(data.data);
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        setUser({
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress,
          role: 'sales',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isUserLoaded, isSignedIn, organization, clerkUser]);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, organization }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
