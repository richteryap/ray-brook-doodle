import { useState, useEffect } from 'react';

export interface SavedProfile {
  uid: string;
  profileName: string;
  isFavorite: boolean;
}

export function useFavorites(currentUid?: string, currentName?: string) {
  const [accounts, setAccounts] = useState<SavedProfile[]>(() => {
    try {
      const stored = localStorage.getItem('raybrook_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      console.error("Failed to parse favorites payload");
      return [];
    }
  });

  // Update profile name in saved accounts if it changed on the server
  useEffect(() => {
    if (!currentUid || !currentName) return;

    setAccounts((prev) => {
      const existingIndex = prev.findIndex(a => a.uid === currentUid);
      if (existingIndex !== -1 && prev[existingIndex].profileName !== currentName) {
        const updatedAccounts = [...prev];
        updatedAccounts[existingIndex] = {
          ...updatedAccounts[existingIndex],
          profileName: currentName,
        };
        localStorage.setItem('raybrook_favorites', JSON.stringify(updatedAccounts));
        return updatedAccounts;
      }
      return prev;
    });
  }, [currentUid, currentName]);

  // Toggle Star Status (Explicit user action saves or removes profile)
  const toggleFavorite = () => {
    if (!currentUid) return;

    setAccounts((prev) => {
      const existingIndex = prev.findIndex(acc => acc.uid === currentUid);
      let newAccounts: SavedProfile[];

      if (existingIndex !== -1) {
        // Already saved; toggle removes it from saved list
        newAccounts = prev.filter(acc => acc.uid !== currentUid);
      } else {
        // Not saved; add it as a favorited profile
        newAccounts = [
          ...prev,
          { uid: currentUid, profileName: currentName || 'Profile', isFavorite: true },
        ];
      }

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

  const isCurrentFavorite = accounts.some(a => a.uid === currentUid);
  
  // Sort Favorites to the left (starred first), then alphabetically
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (Boolean(a.isFavorite) === Boolean(b.isFavorite)) {
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