import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, AlertTriangle, Send, MoreHorizontal, Users, Globe, Trash2, Edit2, CornerDownRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../context/PostContext';

const PostCard = ({ post, setShowReport, addComment, toggleLike, fetchComments }) => {
  const { user } = useAuth();
  const { deletePost, editComment, deleteComment } = usePosts();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // commentId to reply to
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreateComment = () => {
    if (!commentText.trim()) return;
    addComment(post.id, commentText, replyTo);
    setCommentText('');
    setReplyTo(null);
  };

  const toggleComments = () => {
      if (!isCommentsOpen && fetchComments) {
          fetchComments(post.id);
      }
      setIsCommentsOpen(!isCommentsOpen);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreateComment();
  };

  const isOwner = user?.id === post.author.id;

  // Organize comments into a tree
  const organizeComments = (comments) => {
      if (!comments) return [];
      const map = {};
      const roots = [];
      comments.forEach(c => {
          map[c.id] = { ...c, children: [] };
      });
      comments.forEach(c => {
          if (c.parentId && map[c.parentId]) {
              map[c.parentId].children.push(map[c.id]);
          } else {
              roots.push(map[c.id]);
          }
      });
      return roots;
  };

  const commentTree = organizeComments(post.comments);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="relative bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex gap-3 items-center">
            <div className="relative">
              <img src={post.author.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-[13px] tracking-tight">{post.author.name}</h4>
              <div className="flex items-center flex-wrap gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                <span>{post.timestamp}</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  {post.visibility === 'Campus Only' ? <Users size={10} /> : <Globe size={10} />} 
                  {post.visibility}
                </span>
                {post.category && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md tracking-tight normal-case font-bold">{post.category}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
             {isOwner && (
                 <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                 >
                  <Trash2 size={16} />
                 </button>
             )}
             <button 
              onClick={() => setShowReport?.(true)}
              className="p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
             >
              <AlertTriangle size={16} />
            </button>
          </div>
          
          <AnimatePresence>
            {showDeleteConfirm && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center rounded-[2.5rem]"
                >
                    <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3 text-rose-500">
                        <Trash2 size={20} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800 mb-1">Delete this post?</h3>
                    <p className="text-[11px] font-bold text-slate-400 mb-6 max-w-[200px] leading-relaxed">
                        This action cannot be undone. Are you sure you want to proceed?
                    </p>
                    <div className="flex gap-2 w-full max-w-[200px]">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => deletePost(post.id)}
                            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-xs font-bold text-white hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all"
                        >
                            Delete
                        </button>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-slate-600 text-[14px] leading-relaxed mb-5 font-medium px-1 whitespace-pre-wrap">
          {post.content}
        </p>
        
        {post.image && (
          <div className="rounded-[2rem] overflow-hidden max-h-[500px] mb-5 border border-slate-50 relative group bg-slate-50">
            <img src={post.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-50/50 p-1 rounded-2xl border border-slate-100/50">
            <PostAction 
              active={post.isLiked} 
              onClick={() => toggleLike(post.id)} 
              icon={<Heart size={18} fill={post.isLiked ? "#f43f5e" : "none"} />} 
              count={post.likes} 
              color="hover:text-rose-500" 
            />
            <PostAction 
              active={isCommentsOpen} 
              onClick={toggleComments} 
              icon={<MessageCircle size={18} />} 
              count={post.commentCount || 0}
              color="hover:text-indigo-500" 
            />
            <PostAction icon={<Share2 size={18} />} count={post.shares} color="hover:text-emerald-500" />
          </div>
          <button className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
            <Bookmark size={20} />
          </button>
        </div>
      </div>

      {/* Improved Dynamic Comment Section */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50/40 border-t border-slate-100 overflow-hidden"
          >
            <div className="p-6 space-y-5">
              {/* Render dynamic comments */}
              {commentTree && commentTree.length > 0 ? (
                <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {commentTree.map(comment => (
                        <CommentItem 
                            key={comment.id}
                            comment={comment}
                            user={user}
                            onReply={id => { setReplyTo(id); document.getElementById(`comment-input-${post.id}`).focus(); }}
                            onEdit={(id, text) => editComment(id, post.id, text)}
                            onDelete={(id) => deleteComment(id, post.id)}
                        />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs font-bold text-slate-300 uppercase tracking-widest bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No comments yet
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                 {replyTo && (
                     <div className="flex items-center justify-between px-4 py-1 text-xs text-indigo-500 bg-indigo-50 rounded-lg mb-2">
                         <span>Replying to comment...</span>
                         <button onClick={() => setReplyTo(null)} className="font-bold hover:underline">Cancel</button>
                     </div>
                 )}
                 <div className="flex gap-3 items-center bg-white p-2 pl-4 rounded-[1.5rem] shadow-sm border border-slate-100 w-full">
                    <input 
                    id={`comment-input-${post.id}`}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                    className="flex-1 text-xs outline-none font-medium text-slate-600" 
                    />
                    <button 
                    onClick={handleCreateComment}
                    disabled={!commentText.trim()}
                    className={`
                        p-2.5 rounded-xl text-white shadow-lg transition-all
                        ${commentText.trim() 
                        ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700' 
                        : 'bg-slate-300 shadow-none cursor-not-allowed'}
                    `}
                    >
                    <Send size={14} />
                    </button>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CommentItem = ({ comment, user, onReply, onEdit, onDelete, level = 0 }) => {
    const isOwner = user?.id === comment.userId;
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);

    const handleSave = () => {
        onEdit(comment.id, null, editText); 
        setIsEditing(false);
    };

    return (
        <div className={`flex flex-col gap-2 ${level > 0 ? 'ml-5 relative' : ''}`}>
             {level > 0 && <div className="absolute -left-3.5 top-0 w-3.5 h-4 border-l-2 border-b-2 border-slate-200 rounded-bl-xl" />}
             
             <div className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 overflow-hidden shadow-inner">
                    <img src={comment.avatar || `https://i.pravatar.cc/100?u=${comment.user}`} alt="" />
                </div>
                <div className="flex-1 max-w-[90%]">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100/50 group-hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-black text-slate-900 text-[11px] mr-2">{comment.user}</span>
                            <span className="text-[9px] font-bold text-slate-300 uppercase">{comment.time}</span>
                        </div>
                        
                        {isEditing ? (
                            <div className="flex gap-2">
                                <input 
                                    value={editText} 
                                    onChange={e => setEditText(e.target.value)}
                                    className="w-full text-xs border-b border-indigo-200 focus:outline-none bg-transparent"
                                />
                                <button onClick={() => { onEdit(comment.id, editText); setIsEditing(false); }} className="text-[9px] font-bold text-indigo-600">Save</button>
                                <button onClick={() => setIsEditing(false)} className="text-[9px] font-bold text-slate-400">Cancel</button>
                            </div>
                        ) : (
                            <p className="text-[12px] text-slate-700 font-medium leading-snug whitespace-pre-wrap">{comment.text}</p>
                        )}
                    </div>
                    
                    <div className="flex gap-3 mt-1.5 ml-1 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => onReply(comment.id)} className="text-[9px] font-black text-slate-300 uppercase hover:text-indigo-600 transition-colors flex items-center gap-1">
                           <CornerDownRight size={10} /> Reply
                        </button>
                        {isOwner && (
                            <>
                                <button onClick={() => setIsEditing(!isEditing)} className="text-[9px] font-black text-slate-300 uppercase hover:text-indigo-600 transition-colors flex items-center gap-1">
                                    Edit
                                </button>
                                <button onClick={() => onDelete(comment.id)} className="text-[9px] font-black text-slate-300 uppercase hover:text-rose-500 transition-colors flex items-center gap-1">
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
             </div>

             {/* Render Children */}
             {comment.children && comment.children.map(child => (
                 <CommentItem 
                    key={child.id} 
                    comment={child} 
                    user={user} 
                    onReply={onReply} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    level={level + 1} 
                 />
             ))}
        </div>
    );
};

const PostAction = ({ icon, count, color, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 transition-all ${active ? 'bg-white shadow-sm text-indigo-600' : 'hover:bg-white/50 text-slate-400'} ${color}`}
  >
    <span className={active ? 'scale-110 transition-transform' : ''}>{icon}</span>
    <span className="text-[11px] font-black tracking-tight">{count}</span>
  </button>
);

export default PostCard;
