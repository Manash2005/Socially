import { supabase } from '../config/supabase.js';

export const toggleLike = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if like exists
    const { data: existing, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .match({ post_id: postId, user_id: userId })
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Unlike
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .match({ post_id: postId, user_id: userId });

      if (deleteError) throw deleteError;
      return res.status(200).json({ liked: false });
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });

      if (insertError) throw insertError;
      return res.status(201).json({ liked: true });
    }
  } catch (err) {
    next(err);
  }
};
