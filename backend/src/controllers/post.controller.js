import { supabase } from '../config/supabase.js';

/**
 * CREATE POST
 * POST /api/posts
 */
export const createPost = async (req, res, next) => {
  try {
    let {
      content,
      visibility,
      category,
    } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: 'Post content is too short' });
    }

    let image_url = req.body.image_url || null;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      image_url = `${protocol}://${host}/uploads/posts/${req.file.filename}`;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        image_url,
        visibility: visibility || 'public',
        category: category || 'general'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Post created',
      post: data,
      image_url
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET FEED
 */
export const getFeed = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, full_name, avatar_url),
        likes (count),
        comments (count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Supabase returns counts in an array or as a field depending on query
    // To match previous format:
    const formattedPosts = data.map(p => ({
      ...p,
      user_name: p.profiles?.full_name || 'Unknown',
      avatar_url: p.profiles?.avatar_url,
      like_count: p.likes?.[0]?.count || 0,
      comment_count: p.comments?.[0]?.count || 0,
      is_liked: false // Simplified for now
    }));

    res.json({
      data: formattedPosts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET USER POSTS
 */
export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, full_name, avatar_url),
        likes (count),
        comments (count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedPosts = data.map(p => ({
      ...p,
      user_name: p.profiles?.full_name || 'Unknown',
      avatar_url: p.profiles?.avatar_url,
      like_count: p.likes?.[0]?.count || 0,
      comment_count: p.comments?.[0]?.count || 0,
      is_liked: false
    }));

    res.json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE POST
 */
export const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const { error } = await supabase
      .from('posts')
      .delete()
      .match({ id: postId, user_id: userId });

    if (error) throw error;

    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};
