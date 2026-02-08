import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const PostContext = createContext();

export const usePosts = () => useContext(PostContext);

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Fetch Feed from Supabase
  const fetchFeed = async () => {
    try {
      // Fetch posts with author info, like counts, and comment counts
      // Note: Supabase join queries can be tricky for counts. 
      // For simplicity in this step, we fetch posts + profiles, then we might need separate counts or a view later.
      // But let's try a robust query.

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url),
          likes (user_id),
          comments (id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedPosts = data.map(p => {
        const isLiked = user ? p.likes.some(like => like.user_id === user.id) : false;

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
          comments: [], // We load actual comments on demand usually, or could pre-fetch
          commentCount: p.comments.length,
          shares: 0,
          timestamp: new Date(p.created_at).toLocaleDateString(),
          visibility: p.visibility === 'campus' ? 'Campus Only' : 'Public',
          category: p.category
        };
      });

      setPosts(mappedPosts);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching feed:', error);
    }
  };

  const createPost = async (payload) => {
    try {
      let content, imageFile, visibility, category;

      // Handle FormData or Object (Robust Check for Production)
      if (payload && typeof payload.get === 'function') {
        content = payload.get('content');
        imageFile = payload.get('image');
        visibility = payload.get('visibility');
        category = payload.get('category');
      } else {
        // Fallback for direct object usage if any
        content = payload.content;
        imageFile = payload.image; // Assume this might be a file or url
        visibility = payload.visibility;
        category = payload.category;
      }

      let imageUrl = null;

      // Upload Image if present and is a File
      if (imageFile && imageFile instanceof File) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      } else if (typeof imageFile === 'string') {
        // If it's already a string (URL), usage it
        imageUrl = imageFile;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content,
          image_url: imageUrl,
          visibility: visibility || 'public',
          category: category || 'general'
        });

      if (error) throw error;

      await fetchFeed(); // Ensure feed is refreshed before closing modal
      setIsCreatePostOpen(false);
    } catch (err) {
      console.error('Create post failed:', err);
      // Re-throw so the modal can handle it
      throw err;
    }
  };


  const toggleLike = async (postId) => {
    try {
      if (!user) return;

      const currentPost = posts.find(p => p.id === postId);
      if (!currentPost) return;

      const optimisticLiked = !currentPost.isLiked;

      // Optimistic UI update
      setPosts(current => current.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: optimisticLiked,
            likes: optimisticLiked ? p.likes + 1 : p.likes - 1
          };
        }
        return p;
      }));

      if (optimisticLiked) {
        await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      } else {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: postId });
      }

      // Background refresh to ensure consistency
      // fetchFeed(); 
    } catch (err) {
      console.error('Like failed:', err);
      fetchFeed(); // Revert
    }
  };

  const addComment = async (postId, text, parentId = null) => {
    try {
      // Insert comment
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          parent_id: parentId,
          text: text
        });

      if (error) throw error;

      // Refresh comments for this post
      fetchComments(postId);
      // Also updates feed comment count if we refreshed whole feed, but let's just do comments for now
    } catch (err) {
      console.error('Add comment failed:', err);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const mappedComments = data.map(c => ({
        id: c.id,
        user: c.profiles?.full_name || 'Unknown',
        userId: c.user_id,
        avatar: c.profiles?.avatar_url,
        text: c.text,
        parentId: c.parent_id,
        time: new Date(c.created_at).toLocaleDateString()
      }));

      setPosts(current => current.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: mappedComments,
            commentCount: mappedComments.length
          };
        }
        return p;
      }));

    } catch (err) {
      console.error('Fetch comments failed:', err);
    }
  };

  const deletePost = async (postId) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Delete post failed:', err);
    }
  };

  // Placeholder functions for now
  const editComment = async () => { };
  const deleteComment = async () => { };
  const reportPost = async () => { };

  const openCreatePost = () => setIsCreatePostOpen(true);
  const closeCreatePost = () => setIsCreatePostOpen(false);

  useEffect(() => {
    // Initial fetch
    fetchFeed();

    // Ideally subscribe to realtime updates here too
  }, [user]);

  return (
    <PostContext.Provider value={{
      posts,
      createPost,
      toggleLike,
      addComment,
      editComment, // not impl yet
      deleteComment, // not impl yet
      reportPost, // not impl yet
      fetchComments,
      deletePost,
      isCreatePostOpen,
      openCreatePost,
      closeCreatePost,
      refreshTrigger
    }}>
      {children}
    </PostContext.Provider>
  );
};
