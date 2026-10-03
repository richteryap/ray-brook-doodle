import { useState, useEffect } from 'react';

export interface SavedProfile {
  uid: string;
  profileName: string;
  isFavorite: boolean;
}

export function useFavorites(currentUid?: string, currentName?: string) {
  const [accounts, setAccounts] = useState<SavedProfile[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('raybrook_favorites');
      if (stored) {
        setAccounts(JSON.parse(stored));
      }
    } catch {
      console.error("Failed to parse favorites payload");
    }
  }, []);

  // Auto-save current valid profile (Strict Duplicate Prevention)
  useEffect(() => {
    if (!currentUid || !currentName) return;
    
    setAccounts((prev) => {
      const existingIndex = prev.findIndex(a => a.uid === currentUid);
      
      // If the UID is already saved...
      if (existingIndex !== -1) {
        // Check if they changed their profile name and update it silently
        if (prev[existingIndex].profileName !== currentName) {
          const updatedAccounts = [...prev];
          updatedAccounts[existingIndex].profileName = currentName;
          localStorage.setItem('raybrook_favorites', JSON.stringify(updatedAccounts));
          return updatedAccounts;
        }
        return prev; // No changes needed
      }
      
      // Brand new UID, add it
      const newAccounts = [...prev, { uid: currentUid, profileName: currentName, isFavorite: false }];
      localStorage.setItem('raybrook_favorites', JSON.stringify(newAccounts));
      return newAccounts;
    });
  }, [currentUid, currentName]);

  // Toggle Star Status
  const toggleFavorite = () => {
    if (!currentUid) return;
    
    setAccounts((prev) => {
      const newAccounts = prev.map(acc => 
        acc.uid === currentUid ? { ...acc, isFavorite: !acc.isFavorite } : acc
      );
      localStorage.setItem('raybrook_favorites', JSON.stringify(newAccounts));
      return newAccounts;
    });
  };

  // Remove Account
  const deleteSavedAccount = (e: React.MouseEvent, uidToRemove: string) => {
    e.stopPropagation();
    setAccounts((prev) => {
      const newAccounts = prev.filter(acc => acc.uid !== uidToRemove);
      localStorage.setItem('raybrook_favorites', JSON.stringify(newAccounts));
      return newAccounts;
    });
  };

  const isCurrentFavorite = accounts.find(a => a.uid === currentUid)?.isFavorite || false;
  
  // Sort Favorites to the left (starred first), then alphabetically
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.isFavorite === b.isFavorite) {
       return a.profileName.localeCompare(b.profileName);
    }
    return a.isFavorite ? -1 : 1;
  });

  return { 
    sortedAccounts, 
    isCurrentFavorite, 
    toggleFavorite, 
    deleteSavedAccount 
  };
}