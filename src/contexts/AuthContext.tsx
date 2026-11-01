import React, { useState, ReactNode, useEffect } from 'react';
import { AuthContext, type User, type SignupData, type AuthContextType, type UserRole } from './auth-context-definition';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  // Check for existing user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mpm_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData && userData.role) {
          // Don't automatically set user - require role selection first
          setNeedsRoleSelection(true);
          localStorage.setItem('mpm_temp_user', JSON.stringify({
            fullName: userData.fullName,
            storeName: userData.storeName,
            phoneNumber: userData.phoneNumber,
          }));
        } else if (userData) {
          // User exists but doesn't have a role
          setNeedsRoleSelection(true);
          localStorage.setItem('mpm_temp_user', JSON.stringify({
            fullName: userData.fullName,
            storeName: userData.storeName,
            phoneNumber: userData.phoneNumber,
          }));
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('mpm_user');
      }
    }
  }, []);

  const login = async (phoneNumber: string, password: string): Promise<boolean> => {
    // Simulate API call - in real app, this would validate against local DB
    console.log('Attempting login:', { phoneNumber, password });
    
    // For demo purposes, we'll simulate a successful login
    // In a real app, you would validate credentials here
    
    // Check if user already exists with this phone number
    const existingUser = localStorage.getItem('mpm_user');
    if (existingUser) {
      try {
        const userData = JSON.parse(existingUser);
        if (userData.phoneNumber === phoneNumber) {
          // User exists, check if they have a role
          if (userData.role) {
            setUser(userData);
            setNeedsRoleSelection(false);
            return true;
          } else {
            // User exists but needs role selection
            setNeedsRoleSelection(true);
            localStorage.setItem('mpm_temp_user', JSON.stringify({
              fullName: userData.fullName,
              storeName: userData.storeName,
              phoneNumber: userData.phoneNumber,
            }));
            return true;
          }
        }
      } catch (error) {
        console.error('Error parsing existing user:', error);
      }
    }
    
    // New user - for demo, we'll create a new user and require role selection
    setNeedsRoleSelection(true);
    
    // Store temporary user data for role selection
    const tempUserData = {
      fullName: 'Store Owner',
      storeName: 'My Store',
      phoneNumber,
    };
    localStorage.setItem('mpm_temp_user', JSON.stringify(tempUserData));
    
    return true;
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    // Simulate API call - in real app, this would save to local DB
    console.log('Creating account:', data);
    
    // Check if user already exists with this phone number
    const existingUser = localStorage.getItem('mpm_user');
    if (existingUser) {
      try {
        const userData = JSON.parse(existingUser);
        if (userData.phoneNumber === data.phoneNumber) {
          // User exists, check if they have a role
          if (userData.role) {
            setUser(userData);
            setNeedsRoleSelection(false);
            return true;
          } else {
            // User exists but needs role selection
            setNeedsRoleSelection(true);
            localStorage.setItem('mpm_temp_user', JSON.stringify({
              fullName: data.fullName,
              storeName: data.storeName,
              phoneNumber: data.phoneNumber,
            }));
            return true;
          }
        }
      } catch (error) {
        console.error('Error parsing existing user:', error);
      }
    }
    
    // New user - after successful signup, we need role selection
    setNeedsRoleSelection(true);
    
    // Store temporary user data without role
    const tempUserData = {
      fullName: data.fullName,
      storeName: data.storeName,
      phoneNumber: data.phoneNumber,
    };
    localStorage.setItem('mpm_temp_user', JSON.stringify(tempUserData));
    
    return true;
  };

  const setUserRole = (role: UserRole) => {
    console.log('setUserRole called with:', role);
    const tempUserData = localStorage.getItem('mpm_temp_user');
    console.log('tempUserData:', tempUserData);
    
    if (tempUserData) {
      try {
      const userData = JSON.parse(tempUserData);
      const newUser: User = {
        id: Date.now().toString(),
        fullName: userData.fullName,
        storeName: userData.storeName,
        phoneNumber: userData.phoneNumber,
        role
      };
      
      console.log('Creating user with temp data:', newUser);
      setUser(newUser);
      setNeedsRoleSelection(false);
      localStorage.setItem('mpm_user', JSON.stringify(newUser));
      localStorage.removeItem('mpm_temp_user');
      } catch (error) {
        console.error('Error parsing temp user data:', error);
        // Fallback: create a default user if temp data is corrupted
        const newUser: User = {
          id: Date.now().toString(),
          fullName: 'Store Owner',
          storeName: 'My Store',
          phoneNumber: '1234567890',
          role
        };
        
        console.log('Creating default user due to error:', newUser);
        setUser(newUser);
        setNeedsRoleSelection(false);
        localStorage.setItem('mpm_user', JSON.stringify(newUser));
        localStorage.removeItem('mpm_temp_user');
      }
    } else {
      // Fallback: create a default user if temp data doesn't exist
      const newUser: User = {
        id: Date.now().toString(),
        fullName: 'Store Owner',
        storeName: 'My Store',
        phoneNumber: '1234567890',
        role
      };
      
      console.log('Creating default user:', newUser);
      setUser(newUser);
      setNeedsRoleSelection(false);
      localStorage.setItem('mpm_user', JSON.stringify(newUser));
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('mpm_user', JSON.stringify(updatedUser));
    }
  };

  const resetRoleSelection = () => {
    console.log('resetRoleSelection called');
    setUser(null);
    setNeedsRoleSelection(false);
    localStorage.removeItem('mpm_user');
    localStorage.removeItem('mpm_temp_user');
    console.log('Role selection reset, needsRoleSelection:', false);
  };

  const logout = () => {
    console.log('logout called');
    setUser(null);
    setNeedsRoleSelection(false);
    localStorage.removeItem('mpm_user');
    localStorage.removeItem('mpm_temp_user');
    console.log('User logged out, needsRoleSelection:', false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      setUserRole,
      updateUser,
      resetRoleSelection,
      logout,
      isAuthenticated: !!user && !needsRoleSelection,
      needsRoleSelection
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Re-export useAuth hook
export { useAuth } from '../hooks/use-auth';
