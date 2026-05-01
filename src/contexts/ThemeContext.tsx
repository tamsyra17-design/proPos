import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/auth/AuthProvider';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  primaryColor: string;
  setTheme: (theme: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  primaryColor: '#2563eb',
  setTheme: () => {},
  setPrimaryColor: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [primaryColor, setPrimaryColorState] = useState('#2563eb');

  useEffect(() => {
    if (profile?.settings?.theme) {
      setThemeState(profile.settings.theme);
    }
    if (profile?.settings?.primaryColor) {
      setPrimaryColorState(profile.settings.primaryColor);
    }
  }, [profile]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);
    
    // Generate a darker shade (simplified logic)
    // In a real app we'd use a color library
    root.style.setProperty('--primary-color-dark', primaryColor); 
  }, [primaryColor]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          'settings.theme': newTheme
        });
      } catch (err) {
        console.error('Failed to save theme preference', err);
      }
    }
  };

  const setPrimaryColor = async (color: string) => {
    setPrimaryColorState(color);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          'settings.primaryColor': color
        });
      } catch (err) {
        console.error('Failed to save color preference', err);
      }
    }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, primaryColor, setTheme, setPrimaryColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
