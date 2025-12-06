import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Login with email/password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await pool.query(
      'SELECT id, email, name, password_hash, role, engineer_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        engineerName: user.engineer_name,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        engineerName: user.engineer_name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AD Login (simulated - replace with real AD integration)
router.post('/login/ad', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Simulate AD lookup - in production, integrate with Active Directory
    const result = await pool.query(
      `SELECT id, email, name, role, engineer_name FROM users 
       WHERE LOWER(email) LIKE $1 OR LOWER(name) LIKE $1`,
      [`%${username.toLowerCase()}%`]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        engineerName: user.engineer_name,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        engineerName: user.engineer_name,
      },
    });
  } catch (error) {
    console.error('AD Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate invitation token
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    const result = await pool.query(
      `SELECT id, email, name, invitation_token, invitation_expires 
       FROM users 
       WHERE invitation_token = $1 AND invitation_expires > NOW()`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }
    
    const user = result.rows[0];
    res.json({
      valid: true,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password via invitation token
router.post('/invite/:token/reset-password', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Validate token
    const tokenResult = await pool.query(
      `SELECT id, email, name, invitation_token, invitation_expires 
       FROM users 
       WHERE invitation_token = $1 AND invitation_expires > NOW()`,
      [token]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }
    
    const user = tokenResult.rows[0];
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update password and clear invitation token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, invitation_token = NULL, invitation_expires = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [passwordHash, user.id]
    );
    
    res.json({ 
      message: 'Password reset successfully',
      email: user.email 
    });
  } catch (error) {
    console.error('Reset password via invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

