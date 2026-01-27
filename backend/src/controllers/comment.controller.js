import { db } from '../config/db.js';

export const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text, parentId } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const [result] = await db.query(
      `INSERT INTO comments (post_id, user_id, text, parent_id)
       VALUES (?, ?, ?, ?)`,
      [postId, userId, text, parentId || null]
    );

    res.status(201).json({
      message: 'Comment added',
      commentId: result.insertId
    });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const [comments] = await db.query(`
      SELECT comments.id, comments.text, comments.parent_id, comments.created_at, comments.user_id, users.name, users.avatar_url
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at ASC
    `, [postId]);

    res.json(comments);
  } catch (err) {
    next(err);
  }
};

export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.id; // Corrected from req.user.id

    // Check ownership
    const [existing] = await db.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Comment not found' });

    if (existing[0].user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('UPDATE comments SET text = ? WHERE id = ?', [text, commentId]);
    res.json({ message: 'Comment updated' });

  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [existing] = await db.query('SELECT user_id FROM comments WHERE id = ?', [commentId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Comment not found' });

    if (existing[0].user_id !== userId) { // can expand to admin later
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ message: 'Comment deleted' });

  } catch (err) {
    next(err);
  }
};
