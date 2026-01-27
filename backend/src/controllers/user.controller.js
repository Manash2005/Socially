import { db } from '../config/db.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;


    const [users] = await db.query(`
      SELECT 
        u.id, u.name, u.username, u.email, u.role, u.avatar_url, u.bio, u.batch_year, u.campus, u.department, u.created_at,
        (SELECT COUNT(*) FROM posts WHERE posts.user_id = u.id) as post_count
      FROM users u 
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    next(err);
  }
};
