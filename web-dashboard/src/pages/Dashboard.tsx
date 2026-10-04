import { type User as SupabaseUser } from "@supabase/supabase-js";
import { Loader2, LogOut, User, X, Bookmark, Search, Star, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useFavorites } from "../hooks/useFavorites";

interface Show {
  id: string;
  show_name: string;
  latest_episode: number;
  total_episodes: number | string;
  updated_at: string;
}

type SortKey = 'show_name' | 'updated_at';
type SortDirection = 'asc' | 'desc';

const getDynamicStatus = (latest: number, total: number | string) => {
  const totalNum = typeof total === 'string' ? parseInt(total, 10) : total;
  
  if (!isNaN(totalNum) && totalNum > 0 && latest >= totalNum) {
    return { label: "Completed", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  }
  
  return { label: "Watching", color: "bg-blue-50 text-blue-600 border-blue-200" };
};

export default function Dashboard() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [shows, setShows] = useState<Show[]>([]);
  const [profileName, setProfileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [isSavedBarOpen, setIsSavedBarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [loggedInName, setLoggedInName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { sortedAccounts, isCurrentFavorite, toggleFavorite, deleteSavedAccount } = useFavorites(uid, profileName);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchActiveUser(sessionUser: SupabaseUser | null) {
      setCurrentUser(sessionUser);

      if (!sessionUser) {
        setLoggedInName(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', sessionUser.id)
          .single();

        if (error) {
          console.error("Failed to fetch display name from profiles:", error.message);
          return;
        }

        if (data?.username) {
          setLoggedInName(data.username);
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchActiveUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchActiveUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initDashboard() {
      setError(null);
      setLoading(true);

      if (!uid) {
        if (isMounted) setLoading(false);
        return;
      }

      if (isNaN(Number(uid))) {
        if (isMounted) {
          setError("Invalid Profile ID");
          setLoading(false);
        }
        return;
      }

      try {
        const { data: profileData, error: profileErr } = await supabase.rpc(
          "get_public_profile",
          { p_uid: parseInt(uid) }
        );

        if (profileErr) throw profileErr;
        if (!profileData || profileData.length === 0) {
          if (isMounted) {
            setError("User not found");
            setLoading(false);
          }
          return;
        }
        
        const targetUserId = profileData[0].user_id;
        if (isMounted) setProfileName(profileData[0].display_name);

        const { data: showsData, error: showsErr } = await supabase
          .from("active_shows")
          .select("id, show_name, latest_episode, total_episodes, updated_at")
          .eq("user_id", targetUserId);

        if (showsErr) throw showsErr;

        if (isMounted) {
          setShows(showsData || []);
          setLoading(false);
        }

      } catch (err: unknown) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error("Dashboard load error:", errorMessage);
          setError("Failed to load dashboard data.");
          setLoading(false);
        }
      }
    }

    initDashboard();
    return () => { isMounted = false; };
  }, [uid]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setLoggedInName(null);
    setMenuOpen(false);
    navigate("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/u/${searchInput.trim()}`);
      setSearchInput("");
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'show_name' ? 'asc' : 'desc');
    }
  };

  const sortedShows = [...shows].sort((a, b) => {
    if (sortKey === 'show_name') {
      const compare = a.show_name.localeCompare(b.show_name);
      return sortDirection === 'asc' ? compare : -compare;
    } else {
      const dateA = new Date(a.updated_at).getTime();
      const dateB = new Date(b.updated_at).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 flex flex-col">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-8 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="bg-slate-200/50 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
            <img src="/logo.png" alt="Ray Brook" className="w-10 h-10 object-contain" />
          </button>
          <span className="text-xl font-bold tracking-tight text-slate-900">Ray Brook</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full transition-colors border border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <Search className="w-5 h-5" />
          </button>

          {sortedAccounts.length > 0 && (
            <button 
              onClick={() => setIsSavedBarOpen(!isSavedBarOpen)}
              className={`p-2 rounded-full transition-colors border ${
                isSavedBarOpen 
                  ? "bg-slate-200 border-slate-300 text-slate-900" 
                  : "border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
              title="Toggle Saved Profiles"
            >
              <Bookmark className="w-5 h-5" />
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-full transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <User className="w-5 h-5 text-slate-600" />
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 border-b border-slate-50 mb-1 pb-1">
                  {currentUser ? (
                    <button
                      onClick={() => navigate("/account")}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {loggedInName || currentUser.email}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Manage Account</p>
                    </button>
                  ) : (
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-bold text-slate-900 truncate">Guest</p>
                    </div>
                  )}
                </div>
                {currentUser ? (
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                ) : (
                  <button onClick={() => navigate("/login")} className="w-full text-left px-4 py-2 text-sm text-slate-900 hover:bg-slate-100 flex items-center gap-2 transition-colors">
                    <User className="w-4 h-4" /> Log in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Favorites Ribbon */}
      {sortedAccounts.length > 0 && isSavedBarOpen && (
        <div className="bg-white border-b border-slate-200 px-8 py-2 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0 shadow-sm z-30">
          <div className="flex items-center gap-2 text-slate-400 border-r border-slate-200 pr-4 mr-1">
            <Bookmark className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Saved</span>
          </div>
          {sortedAccounts.map(acc => (
            <div 
              key={acc.uid} 
              onClick={() => navigate(`/u/${acc.uid}`)}
              className={`flex items-center pl-3 pr-2 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                acc.uid === uid 
                  ? "bg-slate-200 border-slate-300 text-slate-900" 
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className={`text-sm font-medium ${acc.isFavorite ? "text-yellow-500" : ""}`}>
                {acc.profileName}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSavedAccount(e, acc.uid);
                }}
                className="p-0.5 rounded-full hover:bg-slate-300/50 text-slate-400 hover:text-slate-700 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {!uid ? (
          <main className="fixed inset-0 flex flex-col items-center justify-center px-4 z-10 pointer-events-none">
            <div className="pointer-events-auto bg-white p-10 rounded-3xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center max-w-md w-full text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Find a Watchlist</h1>
              <p className="text-slate-500 mb-8 text-sm">
                Enter an 8-digit Ray Brook profile ID to view their active series.
              </p>
              <form onSubmit={handleSearch} className="w-full relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter 8-digit ID..."
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all pr-14"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          </main>
        ) : error ? (
          <main className="fixed inset-0 flex flex-col items-center justify-center px-4 z-10 pointer-events-none">
            <div className="pointer-events-auto bg-white p-10 rounded-3xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center max-w-md w-full text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-900 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{error}</h1>
              <p className="text-slate-500 mb-8 text-sm">
                The profile you are looking for does not exist or the ID is invalid. Enter a valid 8-digit ID to view their watchlist.
              </p>
              <form onSubmit={handleSearch} className="w-full relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter 8-digit ID..."
                  className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all pr-14"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          </main>
        ) : (
          <main className="max-w-[1750px] mx-auto px-8 py-4 w-full">
            <div className="mb-3 flex items-end justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{profileName}'s Watchlist</h1>
                  <p className="text-slate-500 text-sm">Tracking {shows.length} active series</p>
                </div>
                <button 
                  onClick={toggleFavorite}
                  className={`p-2 rounded-xl border transition-colors ${
                    isCurrentFavorite 
                      ? "bg-yellow-400 border-yellow-300 hover:bg-yellow-300" 
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Star className={`w-5 h-5 ${isCurrentFavorite ? "fill-white text-white" : "text-slate-400"}`} />
                </button>
              </div>
              {(() => {
                const targetDate = shows.length > 0 && shows[0].updated_at 
                  ? new Date(shows[0].updated_at) 
                  : new Date();
                
                const month = targetDate.getMonth() + 1;
                const year = targetDate.getFullYear();
                
                let seasonName = "Winter";
                if (month >= 4 && month <= 6) seasonName = "Spring";
                else if (month >= 7 && month <= 9) seasonName = "Summer";
                else if (month >= 10 && month <= 12) seasonName = "Fall";

                return (
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2">
                    <span className="text-4xl font-extrabold text-slate-900">{seasonName} {year}</span>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-200/50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-3 pl-8 pr-2 font-semibold w-16">#</th>
                      <th 
                        onClick={() => handleSort('show_name')}
                        className="py-3 px-2 font-semibold cursor-pointer select-none hover:text-slate-900 hover:bg-slate-100/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          Title
                          {sortKey === 'show_name' ? (
                            <span className="flex items-center gap-0.5 text-slate-900 bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] tracking-widest font-bold uppercase">
                              {sortDirection === 'asc' ? <><ChevronUp className="w-3 h-3" /> A-Z</> : <><ChevronDown className="w-3 h-3" /> Z-A</>}
                            </span>
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 px-2 font-semibold text-center">Current Episode</th>
                      <th className="py-3 px-2 font-semibold text-center">Episodes</th>
                      <th 
                        onClick={() => handleSort('updated_at')}
                        className="py-3 px-2 font-semibold text-center cursor-pointer select-none hover:text-slate-900 hover:bg-slate-100/50 transition-colors group"
                      >
                        <div className="flex items-center justify-center gap-2">
                          Last Watched
                          {sortKey === 'updated_at' ? (
                            <span className="flex items-center gap-0.5 text-slate-900 bg-slate-200/60 px-1.5 py-0.5 rounded text-[10px] tracking-widest font-bold uppercase">
                              {sortDirection === 'desc' ? <><ChevronDown className="w-3 h-3" /> Newest</> : <><ChevronUp className="w-3 h-3" /> Oldest</>}
                            </span>
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 pl-2 pr-6 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {sortedShows.map((show, index) => {
                      const statusUI = getDynamicStatus(show.latest_episode, show.total_episodes);
                      return (
                        <tr key={show.id} className="even:bg-slate-200/50 transition-colors group">
                          <td className="py-2 pl-8 pr-2 text-slate-400 font-semibold"> {index + 1} </td>
                          <td className="py-2 px-2 font-semibold text-slate-900 max-w-[300px] truncate"> {show.show_name} </td>
                          <td className="py-2 px-2 text-slate-600 text-center"> Episode {show.latest_episode} </td>
                          <td className="py-2 px-2 text-slate-600 text-center"> {show.total_episodes || "—"} </td>
                          <td className="py-2 px-2 text-slate-500 text-center">
                            {new Date(show.updated_at).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </td>
                          <td className="py-2 pl-2 pr-6 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusUI.color}`}>
                              {statusUI.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {shows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No active shows are currently being tracked.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}