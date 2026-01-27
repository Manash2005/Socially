import { db } from '../config/db.js';

/**
 * CREATE POST
 * POST /api/posts
 */
// CREATE POST
export const createPost = async (req, res, next) => {
  try {
    let {
      content,
      visibility,
      category,
      target_batches,
      target_campuses,
      target_branches
    } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length < 5) {
      return res.status(400).json({ error: 'Post content is too short' });
    }

    // Handle Image Upload
    let image_url = null;
    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      image_url = `${protocol}://${host}/uploads/posts/${req.file.filename}`;
    } else if (req.body.image_url) {
      // Fallback if they sent a URL string (unlikely in form-data but good for compatibility)
      image_url = req.body.image_url;
    }

    // Since we are using multipart/form-data, arrays might come as strings or individual fields
    // If they come as strings, we need to parse them.
    // However, clean logic: if it's undefined or string "null" or "undefined", treat as null.
    // If it's a JSON string, parse it.

    const parseJsonField = (field) => {
      if (!field || field === 'null' || field === 'undefined') return null;
      try {
        return typeof field === 'string' ? field : JSON.stringify(field); // Store as JSON string in DB
      } catch (e) {
        return null;
      }
    };

    // DB expects JSON string for JSON columns or NULL
    // But our frontend sends them as JSON strings inside formdata probably?
    // Let's ensure we store valid JSON.
    // If receiving '["2023"]' string -> that is perfect for DB. 

    const [result] = await db.query(
      `INSERT INTO posts (user_id, content, image_url, visibility, category, target_batches, target_campuses, target_branches)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        content,
        image_url,
        visibility || 'campus',
        category || 'general',
        parseJsonField(target_batches),
        parseJsonField(target_campuses),
        parseJsonField(target_branches)
      ]
    );

    res.status(201).json({
      message: 'Post created',
      postId: result.insertId,
      image_url
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET FEED
 * Supports Cursor-based Pagination
 * QUERY: ?cursor=TIMESTAMP_ISO&limit=20
 */
export const getFeed = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    // Add 10 seconds buffer to cursor to handle potential db timestamp vs server time drift or truncation
    const cursor = req.query.cursor ? new Date(req.query.cursor) : new Date(Date.now() + 10000);

    const [userResult] = await db.query('SELECT batch, campus, branch FROM users WHERE id = ?', [currentUserId]);
    const currentUser = userResult[0] || {};

    // Safety fallback
    // We need to pass a JSON-formatted string to JSON_CONTAINS.
    // e.g. if batch is '2024', we need to pass '"2024"'
    const userBatch = currentUser.batch ? JSON.stringify(currentUser.batch) : null;
    const userCampus = currentUser.campus ? JSON.stringify(currentUser.campus) : null;
    const userBranch = currentUser.branch ? JSON.stringify(currentUser.branch) : null;

    const [posts] = await db.query(`
      SELECT 
        posts.id,
        posts.content,
        posts.image_url,
        posts.visibility,
        posts.category,
        posts.created_at,
        posts.target_batches,
        posts.target_campuses,
        posts.target_branches,
        users.id AS user_id,
        users.name AS user_name,
        users.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS like_count,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) AS is_liked,
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.created_at < ?
      AND (
        posts.user_id = ?
        OR posts.visibility = 'public'
        OR (
          posts.visibility = 'campus' 
          AND (
             posts.target_batches IS NULL 
             OR JSON_CONTAINS(posts.target_batches, ?)
          )
          AND (
             posts.target_campuses IS NULL 
             OR JSON_CONTAINS(posts.target_campuses, ?)
          )
          AND (
             posts.target_branches IS NULL 
             OR JSON_CONTAINS(posts.target_branches, ?)
          )
        )
      )
      ORDER BY posts.created_at DESC
      LIMIT ?
    `, [
      currentUserId,
      cursor,
      currentUserId, // for own posts check
      userBatch,
      userCampus,
      userBranch,
      limit
    ]);

    // Format for frontend
    const formattedPosts = posts.map(p => ({
      ...p,
      is_liked: !!p.is_liked // Convert 1/0 to boolean
    }));

    res.json({
      data: formattedPosts,
      nextCursor: posts.length === limit ? posts[posts.length - 1].created_at : null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET USER POSTS
 * GET /api/posts/user/:userId
 */
export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id; // For 'is_liked' check

    const [posts] = await db.query(`
      SELECT 
        posts.id,
        posts.content,
        posts.image_url,
        posts.visibility,
        posts.category,
        posts.created_at,
        users.id AS user_id,
        users.name AS user_name,
        users.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS like_count,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id AND likes.user_id = ?) AS is_liked,
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS comment_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.user_id = ?
      ORDER BY posts.created_at DESC
    `, [currentUserId, userId]);

    const formattedPosts = posts.map(p => ({
      ...p,
      is_liked: !!p.is_liked
    }));

    res.json(formattedPosts);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE POST
 * DELETE /api/posts/:id
 */
export const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check post ownership
    const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = posts[0];

    // Allow deletion if owner or admin
    if (post.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await db.query('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};
