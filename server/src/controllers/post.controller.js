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

    // Handle visibility object
    let parsedVisibility = visibility;
    if (typeof visibility === 'string' && visibility !== 'null') {
      try {
        parsedVisibility = JSON.parse(visibility);
      } catch (e) {
        parsedVisibility = null;
      }
    } else if (visibility === 'null') {
      parsedVisibility = null;
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content,
        image_url,
        visibility: parsedVisibility, // Stores null if not provided
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
    // 1. Fetch current user's profile to get their batch/campus/branch
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('batch, campus, branch')
      .eq('id', req.user.id)
      .single();

    if (profileError) {
      console.warn('Profile not found for filtering, showing public feed only');
    }

    // 2. Fetch posts
    // For robust filtering on JSONB, we can use Supabase's containment or filter logic.
    // However, the simplest way to represent "Empty OR Contains" in JS for Postgres 
    // is often a raw filter or combining multiple conditions.

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (id, full_name, avatar_url),
        likes (count),
        comments (count)
      `);

    // Filtering Logic:
    // We want posts where:
    // (visibility->'batches' IS NULL OR visibility->'batches' = '[]' OR visibility->'batches' ? USER_BATCH)
    // AND similar for campus and branch.
    // Since Supabase JS client has limits on complex OR/AND JSON logic, 
    // a common pattern is to fetch and filter in JS if the volume is small, 
    // or use a smart 'or' filter string.

    // For now, let's fetch all (or a large limit) and filter or use basic Supabase filters.
    // Given the monorepo structure, let's try a robust filter string if possible.

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // 3. Filter data in JS for precision (handles null/missing as "Everyone")
    const filteredData = data.filter(post => {
      // Rule 0: Always see your own posts
      if (post.user_id === req.user.id) return true;

      const vis = post.visibility;
      // Step 4: Missing/null or specific "public" string = unrestricted
      if (!vis || vis === 'public' || vis === 'null') return true;

      const batches = vis.batches || [];
      const campuses = vis.campuses || [];
      const branches = vis.branches || [];

      // If all arrays are empty, it's public
      if (batches.length === 0 && campuses.length === 0 && branches.length === 0) return true;

      const batchMatch = batches.length === 0 || (profile?.batch && batches.includes(profile.batch));
      const campusMatch = campuses.length === 0 || (profile?.campus && campuses.includes(profile.campus));
      const branchMatch = branches.length === 0 || (profile?.branch && branches.includes(profile.branch));

      return batchMatch && campusMatch && branchMatch;
    });

    // Supabase returns counts in an array or as a field depending on query
    const formattedPosts = filteredData.map(p => ({
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
