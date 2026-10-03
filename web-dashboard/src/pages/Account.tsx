import { Loader2, ArrowLeft, Copy, Check, User as UserIcon, LogOut, KeyRound, Code, Download, Settings, FileText, BookOpen, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Tab = 'settings' | 'logs' | 'library' | 'how-to-use';

export default function Account() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [publicUid, setPublicUid] = useState("");
  const [apiKey, setApiKey] = useState("");
  
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/login");
        return;
      }

      setCurrentUser(session.user);
      setEmail(session.user.email || "");

      const { data, error } = await supabase
        .from('profiles')
        .select('username, public_uid, api_key')
        .eq('id', session.user.id)
        .single();

      if (error) {
        setError("Failed to load profile data.");
      } else if (data) {
        setUsername(data.username || "");
        setOriginalUsername(data.username || "");
        setPublicUid(data.public_uid?.toString() || "");
        setApiKey(data.api_key || "");
      }
      setLoading(false);
    }

    loadProfile();
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!currentUser) return;

    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', currentUser.id);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Username updated successfully!");
      setOriginalUsername(username);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setUsername(originalUsername);
    setIsEditing(false);
    setError(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleGenerateApiKey = async () => {
    if (!currentUser) return;
    setGeneratingKey(true);
    setError(null);
    setSuccess(null);
    
    const newKey = `rb_ext_${crypto.randomUUID().replace(/-/g, '')}`;
    
    const { error } = await supabase
      .from('profiles')
      .update({ api_key: newKey })
      .eq('id', currentUser.id);

    if (error) {
      setError("Failed to generate API Key.");
    } else {
      setApiKey(newKey);
      setSuccess("New API Key generated successfully!");
    }
    setGeneratingKey(false);
  };

  const handleExportData = async () => {
    if (!currentUser) return;
    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase
        .from('active_shows')
        .select('show_name, latest_episode, total_episodes, updated_at')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      let csvContent = "Show Name,Latest Episode,Total Episodes,Last Watched\n";

      if (data) {
        data.forEach(show => {
          // Wrap show_name in quotes and escape internal quotes to prevent commas from breaking the CSV
          const safeName = `"${show.show_name.replace(/"/g, '""')}"`;
          const latestEp = show.latest_episode || 0;
          const totalEp = show.total_episodes || "";
          
          // Format the date neatly
          const dateWathed = new Date(show.updated_at).toLocaleString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
          });
          const safeDate = `"${dateWathed}"`;

          csvContent += `${safeName},${latestEp},${totalEp},${safeDate}\n`;
        });
      }

      // 3. Create a downloadable CSV blob
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raybrook_watchlist_${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess("Watchlist exported as CSV successfully!");
    } catch (err: unknown) {
      console.error("Export error:", err);
      setError("Failed to export watchlist data.");
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'uid' | 'api') => {
    navigator.clipboard.writeText(text);
    if (type === 'uid') {
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } else {
      setCopiedApi(true);
      setTimeout(() => setCopiedApi(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
      </div>
    );
  }

  const renderHeader = () => {
    switch (activeTab) {
      case 'settings':
        return { icon: <UserIcon className="w-10 h-10 text-slate-900" />, title: originalUsername || "Your Account", desc: "Manage your Ray Brook settings" };
      case 'logs':
        return { icon: <FileText className="w-10 h-10 text-slate-900" />, title: "Activity Logs", desc: "View your history and sync events" };
      case 'library':
        return { icon: <BookOpen className="w-10 h-10 text-slate-900" />, title: "Your Library", desc: "Manage your custom collections" };
      case 'how-to-use':
        return { icon: <HelpCircle className="w-10 h-10 text-slate-900" />, title: "How to Use", desc: "Learn how to get the most out of Ray Brook" };
    }
  };

  const headerInfo = renderHeader();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 flex flex-col">
      
      {/* Streamlined Topbar */}
      <header className="bg-white border-b border-slate-200 px-8 py-2 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="bg-slate-200/50 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
            <img src="/logo.png" alt="Ray Brook" className="w-10 h-10 object-contain" />
          </button>
          <span className="text-xl font-bold tracking-tight text-slate-900">Ray Brook</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-full transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <UserIcon className="w-5 h-5 text-slate-600" />
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {originalUsername || email}
                  </p>
                </div>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Settings Layout */}
      <main className="flex-1 flex justify-center py-10 px-8 w-full max-w-[1750px] mx-auto">
        <div className="w-full flex justify-center flex-col md:flex-row gap-5">
          
          {/* LEFT SIDEBAR */}
          <aside className="w-full md:w-64 shrink-0 flex flex-col">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8 px-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <Settings className="w-5 h-5" /> User Settings
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
                  activeTab === 'logs' 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5" /> Logs
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
                  activeTab === 'library' 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-5 h-5" /> Library
              </button>

              <button
                onClick={() => setActiveTab('how-to-use')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
                  activeTab === 'how-to-use' 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-5 h-5" /> How to use
              </button>
            </nav>
          </aside>

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 max-w-5xl">
            <div className="bg-white rounded-3xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex flex-col items-center text-center bg-slate-50/50">
                <div className="w-20 h-20 bg-slate-200/50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  {headerInfo.icon}
                </div>
                <h1 className="text-3xl font-bold text-slate-900">{headerInfo.title}</h1>
                <p className="text-slate-500 text-sm mt-1">{headerInfo.desc}</p>
              </div>
              <div className="px-10 py-6 space-y-6">
                
                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <>
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl text-center font-medium">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-4 rounded-xl text-center font-medium">
                        {success}
                      </div>
                    )}

                    {/* 1. Profile Section */}
                    <section>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-slate-400" /> Profile Details
                      </h2>
                      
                      <div className="space-y-2">
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                          {!isEditing ? (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-900">Username</p>
                                <p className="text-sm text-slate-500">{originalUsername}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setSuccess(null);
                                  setIsEditing(true);
                                }}
                                className="px-4 py-2 bg-white border border-slate-200 font-bold text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handleUpdate} className="flex flex-col sm:flex-row sm:items-end gap-3">
                              <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">Username</label>
                                <input
                                  type="text"
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  required
                                  autoFocus
                                  className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                                />
                              </div>
                              <div className="flex gap-1 mt-1 sm:mt-0">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-4 py-2.5 bg-white border border-slate-200 font-bold text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={saving}
                                  className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center min-w-[80px]"
                                >
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        {/* Read-Only Information */}
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex flex-col gap-1">
                          <p className="font-bold text-slate-900">Email Address</p>
                          <p className="text-sm text-slate-500 truncate">{email}</p>
                        </div>
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div className="overflow-hidden mr-4">
                            <p className="font-bold text-slate-900">UID</p>
                            <p className="text-sm text-slate-500 truncate font-mono">{publicUid}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(publicUid, 'uid')}
                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                            title="Copy UID"
                          >
                            {copiedUid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </section>

                    <hr className="border-slate-100" />

                    {/* 2. Security Section */}
                    <section>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-slate-400" /> Security
                      </h2>
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900">Password</p>
                          <p className="text-sm text-slate-500">Update your account password</p>
                        </div>
                        <button 
                          onClick={() => navigate('/update-password')}
                          className="px-4 py-2 bg-white border border-slate-200 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Change Password
                        </button>
                      </div>
                    </section>

                    <hr className="border-slate-100" />

                    {/* 3. Developer & Data Section */}
                    <section>
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Code className="w-4 h-4 text-slate-400" /> Developer & Data
                      </h2>
                      
                      <div className="space-y-2">
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div className="overflow-hidden mr-4">
                            <p className="font-bold text-slate-900">Extension API Key</p>
                            <p className="text-sm text-slate-500 truncate font-mono">
                              {apiKey ? "••••••••••••••••••••" : "No key generated"}
                            </p>
                          </div>
                          {apiKey ? (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(apiKey, 'api')}
                              className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                              title="Copy API Key"
                            >
                              {copiedApi ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleGenerateApiKey}
                              disabled={generatingKey}
                              className="px-4 py-2 bg-white border border-slate-200 font-bold text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shrink-0 flex items-center gap-2"
                            >
                              {generatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              {generatingKey ? "Generating" : "Generate"}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                          <div>
                            <p className="font-bold text-slate-900">Export Data</p>
                            <p className="text-sm text-slate-500">Download your watchlist as a CSV file</p>
                          </div>
                          <button 
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                          >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {isExporting ? "Exporting" : "Export"}
                          </button>
                        </div>
                      </div>
                    </section>
                  </>
                )}

                {/* PLACEHOLDER TABS */}
                {activeTab !== 'settings' && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Code className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Coming Soon</h3>
                    <p className="text-slate-500 max-w-sm">
                      We are currently building the {activeTab.replace('-', ' ')} page. Check back in a future update!
                    </p>
                  </div>
                )}
                
              </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}