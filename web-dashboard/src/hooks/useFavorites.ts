import { useState, useEffect } from "react";

export interface SavedProfile {
  uid: string;
  profileName: string;
  isFavorite: boolean;
}

export function useFavorites(currentUid?: string, currentName?: string) {
  const [accounts, setAccounts] = useState<SavedProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("raybrook_favorites");
      if (stored) {
        setAccounts(JSON.parse(stored));
      }
    } catch {
      console.error("Failed to parse favorites payload");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Auto-save current valid profile (Strict Duplicate Prevention)
  useEffect(() => {
    if (!isLoaded || !currentUid || !currentName) return;

    setAccounts((prev) => {
      const existingIndex = prev.findIndex((a) => a.uid === currentUid);

      if (existingIndex !== -1) {
        if (prev[existingIndex].profileName !== currentName) {
          const updatedAccounts = [...prev];
          updatedAccounts[existingIndex].profileName = currentName;
          localStorage.setItem(
            "raybrook_favorites",
            JSON.stringify(updatedAccounts)
          );
          return updatedAccounts;
        }
        return prev;
      }

      const newAccounts = [
        ...prev,
        { uid: currentUid, profileName: currentName, isFavorite: false },
      ];
      localStorage.setItem("raybrook_favorites", JSON.stringify(newAccounts));
      return newAccounts;
    });
  }, [isLoaded, currentUid, currentName]);

  // Toggle Star Status (Sorts favorites to the front of saved profiles)
  const toggleFavorite = () => {
    if (!currentUid) return;

    setAccounts((prev) => {
      const newAccounts = prev.map((acc) =>
        acc.uid === currentUid ? { ...acc, isFavorite: !acc.isFavorite } : acc
      );
      localStorage.setItem("raybrook_favorites", JSON.stringify(newAccounts));
      return newAccounts;
    });
  };

  // Remove Account
  const deleteSavedAccount = (e: React.MouseEvent, uidToRemove: string) => {
    e.stopPropagation();

    setAccounts((prev) => {
      const newAccounts = prev.filter((acc) => acc.uid !== uidToRemove);
      localStorage.setItem("raybrook_favorites", JSON.stringify(newAccounts));
      return newAccounts;
    });
  };

  const isCurrentFavorite =
    accounts.find((a) => a.uid === currentUid)?.isFavorite || false;

  // Sort Favorites to the left (starred first), then alphabetically
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.isFavorite === b.isFavorite) {
      return a.profileName.localeCompare(b.profileName);
    }
    return a.isFavorite ? -1 : 1;
  });

  return {
    accounts,
    sortedAccounts,
    isCurrentFavorite,
    isLoaded,
    toggleFavorite,
    deleteSavedAccount,
  };
}
