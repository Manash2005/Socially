import { supabase } from '../config/supabase.js';

export const createReport = async (req, res, next) => {
  const { postId } = req.params;
  const { reason } = req.body;
  const reporterId = req.user.id;

  if (!reason) {
    return res.status(400).json({ error: 'Reason is required' });
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        post_id: postId,
        reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Report submitted successfully',
      report: data,
    });
  } catch (err) {
    next(err);
  }
};
