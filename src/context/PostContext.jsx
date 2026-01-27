import React, { createContext, useContext, useEffect, useState } from 'react';

const PostContext = createContext();

export const usePosts = () => useContext(PostContext);

export const PostProvider = ({ children }) => {
  const [posts, setPosts] = useState([]);
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Trigger for other components (like Profile) to refresh their data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/posts/feed', {
        headers: getAuthHeaders()
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error("Unauthorized - Please login");
        }
        return;
      }

      const responseData = await res.json();
      
      const mappedPosts = (responseData.data || []).map(p => ({
        id: p.id,
        author: {
          id: p.user_id,
          name: p.user_name,
          avatar: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.user_name)}&background=random`
        },
        content: p.content,
        image: p.image_url,
        likes: p.like_count,
        isLiked: p.is_liked,
        comments: [], // Comments are not returned by feed API, only count
        commentCount: p.comment_count,
        shares: 0,
        timestamp: new Date(p.created_at).toLocaleDateString(), // Simple date for now
        visibility: p.visibility === 'campus' ? 'Campus Only' : 'Public',
        category: p.category
      }));

      setPosts(mappedPosts); 
      setRefreshTrigger(prev => prev + 1); // Notify listeners
    } catch (err) {
      console.error("Failed to fetch feed:", err);
      setPosts([]);
    }
  };

  const toggleLike = async (postId) => {
    try {
      // Optimistic Update
      setPosts(current => current.map(p => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likes: isLiked ? p.likes + 1 : p.likes - 1
          };
        }
        return p;
      }));

      await fetch(`/api/likes/${postId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.error("Like failed", err);
      fetchFeed(); // Revert on error
    }
  };

  const addComment = async (postId, text, parentId = null) => {
    try {
        // Optimistic update (simplified)
        // Ideally we should wait for response for meaningful ID if we want to reply immediately, 
        // but for now we just push.
        
        await fetch(`/api/comments/${postId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ text, parentId })
        });
        
        // Background fetch to get real comment with server timestamp/ID
        fetchComments(postId);

    } catch (err) {
        console.error("Comment failed", err);
    }
  };

  const fetchComments = async (postId) => {
      try {
          const res = await fetch(`/api/comments/${postId}`, { headers: getAuthHeaders() });
          const data = await res.json();
          
          setPosts(current => current.map(p => {
              if (p.id === postId) {
                  return {
                      ...p,
                      comments: data.map(c => ({
                          id: c.id,
                          user: c.name,
                          userId: c.user_id, // For ownership check
                          avatar: c.avatar_url,
                          text: c.text,
                          parentId: c.parent_id,
                          time: new Date(c.created_at).toLocaleDateString() + ' ' + new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      })),
                      commentCount: data.length
                  };
              }
              return p;
          }));
      } catch (err) {}
  };

  const editComment = async (commentId, postId, text) => {
      try {
          await fetch(`/api/comments/${commentId}`, {
              method: 'PUT',
              headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify({ text })
          });
          fetchComments(postId);
      } catch (err) { console.error(err); }
  };

  const deleteComment = async (commentId, postId) => {
      try {
          await fetch(`/api/comments/${commentId}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
          });
          fetchComments(postId);
      } catch (err) { console.error(err); }
  };

  const deletePost = async (postId) => {
      try {
          const res = await fetch(`/api/posts/${postId}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
          });
          if (res.ok) {
              setPosts(current => current.filter(p => p.id !== postId));
              setRefreshTrigger(prev => prev + 1); // Refresh profile counts
          }
      } catch (err) { console.error(err); }
  };

  const createPost = async (payload) => {
    // If payload is FormData (which it is now), don't stringify and don't set Content-Type (browser does it with boundary)
    const isFormData = payload instanceof FormData;

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...getAuthHeaders()
      },
      body: isFormData ? payload : JSON.stringify(payload)
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create post');
    }

    setRefreshTrigger(prev => prev + 1); // Force immediate refresh of profile/feed
    fetchFeed();
  };

  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const openCreatePost = () => setIsCreatePostOpen(true);
  const closeCreatePost = () => setIsCreatePostOpen(false);

  const reportPost = async (postId, reason) => {
    try {
      await fetch(`/api/reports/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ reason })
      });
    } catch (err) {
      console.error("Report failed", err);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <PostContext.Provider value={{ 
      posts, 
      createPost, 
      toggleLike, 
      addComment, 
      editComment,
      deleteComment,
      fetchComments,
      deletePost,
      reportPost,
      isCreatePostOpen,
      openCreatePost,
      closeCreatePost,
      refreshTrigger // Expose for Profile
    }}>
      {children}
    </PostContext.Provider>
  );
};
