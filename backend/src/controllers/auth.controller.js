import { supabase } from '../config/supabase.js';

/* ---------------- REGISTER ---------------- */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) throw error;

    res.status(201).json({ message: 'User registered successfully', user: data.user });
  } catch (err) {
    next(err);
  }
};

/* ---------------- LOGIN ---------------- */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      token: data.session.access_token,
      user: data.user
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- GET CURRENT USER (ME) ---------------- */
export const getMe = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: data });
  } catch (err) {
    next(err);
  }
};

/* ---------------- UPDATE CURRENT USER (ME) ---------------- */
export const updateMe = async (req, res, next) => {
  try {
    let { avatar_url, bio, username, batch, campus, branch } = req.body;
    const userId = req.user.id;

    if (req.file) {
      const protocol = req.protocol;
      const host = req.get('host');
      avatar_url = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        avatar_url,
        bio,
        username,
        batch,
        campus,
        branch
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Profile updated successfully',
      user: data
    });

  } catch (err) {
    next(err);
  }
};

