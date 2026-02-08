import React, { useState } from 'react';
import { 
  Image, Video, Heart, MessageCircle, Share2, Plus, 
  Globe, Bookmark, AlertTriangle, Send, MoreHorizontal, Smile, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';
import PostCard from './PostCard';

const Feed = () => {
  const { user } = useAuth();
  const { posts, openCreatePost, addComment, toggleLike, fetchComments, reportPost } = usePosts();
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState(null);

  const handleReportSubmit = async () => {
    if (reportPostId && reportReason) {
      await reportPost(reportPostId, reportReason);
      setReportPostId(null);
      setReportReason(null);
    }
  };

  const stories = [
    { name: 'Your Story', img: user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`, isUser: true },

    { name: 'Justin', img: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150' },
    { name: 'Davis', img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
    { name: 'Randy', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { name: 'Charlie', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
    { name: 'Zaire', img: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150' },
  ];

  return (
    <div className="flex-1 max-w-[640px] mx-auto px-4 py-6 h-screen overflow-y-auto no-scrollbar bg-[#F8FAFC]">
      
      {/* 1. Refined Circular Stories */}
      <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar py-2">
        {stories.map((story, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.92 }} 
            className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
          >
            <div className="relative">
              <div className={`p-[2.5px] rounded-full transition-transform duration-500 group-hover:rotate-45 ${
                story.isUser ? 'bg-slate-200' : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
              }`}>
                <div className="p-[2px] bg-white rounded-full">
                  <img src={story.img} className="w-14 h-14 rounded-full object-cover group-hover:scale-105 transition-transform" alt="" />
                </div>
              </div>
              {story.isUser && (
                <div className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-1 border-2 border-white shadow-sm">
                  <Plus className="text-white w-2.5 h-2.5" strokeWidth={3} />
                </div>
              )}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">
              {story.name.split(' ')[0]}
            </span>
          </motion.div>
        ))}
      </div>

      {/* 2. Integrated Post Creator */}
      <div 
        onClick={openCreatePost}
        className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 mb-6 group cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex gap-4 items-center">
          <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} className="w-10 h-10 rounded-full object-cover" alt="" />
          <div className="flex-1 bg-transparent border-none text-sm font-medium text-slate-400">
            Share an update...
          </div>
          <div className="flex gap-1">
            <button className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-all"><Image size={18} /></button>
            <button className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"><Smile size={18} /></button>
          </div>
        </div>
      </div>

      {/* 3. Posts Feed */}
      <div className="space-y-6">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            setShowReport={() => setReportPostId(post.id)} 
            addComment={addComment}
            toggleLike={toggleLike}
            fetchComments={fetchComments}
          />
        ))}
      </div>

      {/* 4. Reporting Modal */}
      <AnimatePresence>
        {reportPostId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/30 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-[340px] p-8 shadow-2xl border border-white"
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-base font-black text-slate-900 mb-1">Report Content</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-6">Select Reason</p>
                
                <div className="space-y-2 mb-8">
                  {['Inappropriate Content', 'Spam', 'Harassment', 'Other'].map(reason => (
                    <button 
                      key={reason} 
                      onClick={() => setReportReason(reason)}
                      className={`w-full py-3.5 rounded-2xl border text-xs font-bold transition-all ${
                        reportReason === reason 
                        ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-inner' 
                        : 'border-slate-100 text-slate-600 hover:bg-white hover:shadow-md hover:border-transparent'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setReportPostId(null)} className="flex-1 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Cancel</button>
                  <button 
                    onClick={handleReportSubmit}
                    disabled={!reportReason}
                    className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 ${
                       reportReason ? 'bg-slate-900 text-white hover:bg-rose-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >Submit</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* --- Sub Components --- */

export default Feed;