import { supabase } from '../config/supabase.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        posts (count)
      `)
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Format post_count
    const formattedUser = {
      ...data,
      post_count: data.posts?.[0]?.count || 0
    };

    res.json(formattedUser);
  } catch (err) {
    next(err);
  }
};
