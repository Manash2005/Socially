import { supabase } from '../config/supabase.js';

export const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text, parentId } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        text,
        parent_id: parentId || null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Comment added',
      comment: data
    });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const { data, error } = await supabase
      .from('comments')
      .select(`
        id, text, parent_id, created_at, user_id,
        profiles:user_id (full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formattedComments = data.map(c => ({
      ...c,
      name: c.profiles?.full_name || 'Unknown',
      avatar_url: c.profiles?.avatar_url
    }));

    res.json(formattedComments);
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('comments')
      .update({ text })
      .match({ id: commentId, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Comment not found or not authorized' });

    res.json({ message: 'Comment updated', comment: data });

  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from('comments')
      .delete()
      .match({ id: commentId, user_id: userId });

    if (error) throw error;

    res.json({ message: 'Comment deleted' });

  } catch (err) {
    next(err);
  }
};
