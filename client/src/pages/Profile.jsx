import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { MapPin, Calendar, ShieldCheck, Edit3, X, Check, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import { usePosts } from '../context/PostContext';
import { supabase } from '../lib/supabaseClient';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth(); // Get logged-in user
    const { toggleLike, addComment, fetchComments, refreshTrigger } = usePosts();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        bio: '',
        // avatar_url: '', // Handled separately via file upload usually
        username: '',
        batch: '',
        campus: 'Bengaluru',
        branch: 'SOT'
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfileAndPosts = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // 1. Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (profileError) throw profileError;
                if (!profileData) throw new Error("User not found");

                setProfile(profileData);

                // 2. Fetch User's Posts
                const { data: postsData, error: postsError } = await supabase
                    .from('posts')
                    .select(`
            *,
            profiles:user_id (id, full_name, avatar_url),
            likes (user_id),
            comments (id)
          `)
                    .eq('user_id', id)
                    .order('created_at', { ascending: false });

                if (postsError) throw postsError;

                const mappedPosts = postsData.map(p => {
                    const isLiked = currentUser ? p.likes.some(like => like.user_id === currentUser.id) : false;
                    return {
                        id: p.id,
                        author: {
                            id: p.profiles?.id,
                            name: p.profiles?.full_name || 'Unknown',
                            avatar: p.profiles?.avatar_url
                        },
                        content: p.content,
                        image: p.image_url,
                        likes: p.likes.length,
                        isLiked: isLiked,
                        comments: [],
                        commentCount: p.comments.length,
                        shares: 0,
                        timestamp: new Date(p.created_at).toLocaleDateString(),
                        visibility: p.visibility === 'campus' ? 'Campus Only' : 'Public',
                        category: p.category
                    };
                });

                setPosts(mappedPosts);

                // Initialize Edit Form
                setEditForm({
                    bio: profileData.bio || '',
                    username: profileData.username || '',
                    batch: profileData.batch || '',
                    campus: profileData.campus || 'Bengaluru',
                    branch: profileData.branch || 'SOT' // Adjusted to match DB column name 'branch' vs 'department'
                });

            } catch (err) {
                console.error("Profile fetch error:", err);
                setError('User not found');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileAndPosts();
    }, [id, refreshTrigger, currentUser]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            let newAvatarUrl = profile.avatar_url;

            // 1. Upload Avatar if Changed
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                // Upload to 'avatars' bucket
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile);

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                newAvatarUrl = publicUrl;
            }

            // 2. Update Profile in Supabase (Database)
            const updates = {
                username: editForm.username,
                bio: editForm.bio,
                campus: editForm.campus,
                batch: editForm.batch,
                branch: editForm.branch,
                avatar_url: newAvatarUrl, // Update avatar_url in DB
                // updated_at: new Date(), // REMOVED: Column does not exist in schema
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', currentUser.id);

            if (error) throw error;

            // 3. Update Supabase Auth User Metadata (Global Sync)
            // This ensures useAuth() user object is updated immediately so Navbar/Sidebar reflect changes
            const { error: authUpdateError } = await supabase.auth.updateUser({
                data: {
                    avatar_url: newAvatarUrl,
                    full_name: profile.full_name, // Ensure this is synced if editable
                    ...updates
                }
            });

            if (authUpdateError) throw authUpdateError;

            setProfile(prev => ({ ...prev, ...updates }));

            // Update local posts state to reflect new avatar immediately
            setPosts(prevPosts => prevPosts.map(p => {
                // Check if the post belongs to the current user (using p.author.id or just comparing current user)
                // In Profile page, all posts belong to likely the profile user, but let's be safe
                if (p.author.id === currentUser.id) {
                    return {
                        ...p,
                        author: {
                            ...p.author,
                            avatar: newAvatarUrl,
                            name: updates.full_name || p.author.name // Update name if changed (though name isn't in edit form yet)
                        }
                    };
                }
                return p;
            }));

            setIsEditing(false);

        } catch (err) {
            console.error("Update failed:", err);
            alert(`Failed to update profile: ${err.message}`);
        }
    };

    const isOwnProfile = currentUser && profile && currentUser.id === profile.id;

    if (loading) return (
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center text-slate-400">
            <div className="text-xl font-bold mb-2">User Not Found</div>
            <p className="text-sm">The user you are looking for does not exist.</p>
        </div>
    );

    return (
        <div className="bg-[#F1F5F9] min-h-screen text-slate-900">
            <Navbar />
            <div className="max-w-[1600px] mx-auto flex justify-center pt-4 px-0 lg:px-4 pb-4 gap-4">
                <Sidebar />

                {/* Main Profile Content */}
                <main className="flex-1 max-w-4xl w-full min-w-0">

                    {/* Cover Image & Header Info */}
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative mb-6">
                        {/* Cover */}
                        <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                        </div>

                        <div className="px-8 pb-8 relative">
                            {/* Avatar */}
                            <div className="absolute -top-16 left-8 group/avatar">
                                <div className="p-1.5 bg-white rounded-full relative">
                                    <img
                                        src={previewUrl || profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=random`}
                                        alt={profile.full_name}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-slate-50"
                                    />

                                    {/* Overlay Camera Icon for Editing */}
                                    {isEditing && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                                        >
                                            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                                <Edit3 className="text-white w-6 h-6" />
                                            </div>
                                        </button>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons (Right) */}
                            <div className="flex justify-end pt-4 mb-4 gap-3">
                                {isOwnProfile ? (
                                    isEditing ? (
                                        <>
                                            <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
                                                <X size={18} />
                                            </button>
                                            <button onClick={handleSave} className="px-4 py-2 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
                                                <Check size={16} /> Save
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="px-5 py-2 rounded-xl font-bold text-sm border-2 border-slate-100 text-slate-600 hover:border-slate-300 transition-colors flex items-center gap-2">
                                            <Edit3 size={16} /> Edit Profile
                                        </button>
                                    )
                                ) : (
                                    <>
                                        <button className="px-5 py-2 rounded-xl font-bold text-sm border-2 border-slate-100 text-slate-600 hover:border-slate-300 transition-colors">
                                            Message
                                        </button>
                                        <button className="px-5 py-2 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-slate-200 hover:shadow-indigo-200 transition-all">
                                            Follow
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* User Info */}
                            <div className="mt-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-2xl font-black text-slate-900">{profile.full_name}</h1>
                                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                                        STUDENT
                                    </span>
                                </div>
                                {/* Username (if we have it, profiles table might not have username initially) */}


                                {isEditing ? (
                                    <div className="space-y-4 max-w-lg mb-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative group">
                                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Batch Year</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                        value={editForm.batch}
                                                        onChange={e => setEditForm({ ...editForm, batch: e.target.value })}
                                                    >
                                                        <option value="" disabled>Select Year</option>
                                                        {['2023', '2024', '2025'].map(year => (
                                                            <option key={year} value={year}>{year}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative group">
                                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Campus</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                        value={editForm.campus}
                                                        onChange={e => setEditForm({ ...editForm, campus: e.target.value })}
                                                    >
                                                        {['Bengaluru', 'Lucknow', 'Pune', 'Noida', 'Indore', 'Patna'].map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Department</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                        value={editForm.branch}
                                                        onChange={e => setEditForm({ ...editForm, branch: e.target.value })}
                                                    >
                                                        {['SOT', 'SOM', 'SOH'].map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase">Bio</label>
                                            <textarea
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500 min-h-[80px]"
                                                value={editForm.bio}
                                                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 font-medium mb-4 max-w-2xl">
                                        {profile.bio || "No bio yet."}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        <span>{profile.campus || 'Campus Not Set'}</span>
                                    </div>
                                    {profile.branch && (
                                        <div className="flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>{profile.branch}</span>
                                        </div>
                                    )}
                                    {profile.batch && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            <span>Batch of {profile.batch}</span>
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-8 mt-8 border-t border-slate-100 pt-6">
                                <div className="text-center">
                                    <div className="text-xl font-black text-slate-900">{posts.length}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posts</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-slate-900">0</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-slate-900">0</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Following</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User's Posts */}
                    {posts.length > 0 ? (
                        <div className="space-y-6">
                            {posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    addComment={addComment}
                                    toggleLike={toggleLike}
                                    fetchComments={fetchComments}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center">
                            <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4 text-slate-300">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No posts yet</h3>
                            <p className="text-slate-400 text-sm">When {profile.full_name} posts, you'll see it here.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Profile;
