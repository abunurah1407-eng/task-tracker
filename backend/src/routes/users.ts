import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

// Get all users (admin only - can see admin, director, and engineer accounts)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can access
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.engineer_name, u.color as user_color, u.created_at, u.updated_at,
              u.invitation_token, u.invitation_expires,
              COALESCE(u.color, e.color) as color, e.tasks_total
       FROM users u
       LEFT JOIN engineers e ON u.engineer_name = e.name
       ORDER BY 
         CASE u.role 
           WHEN 'admin' THEN 1
           WHEN 'director' THEN 2
           WHEN 'engineer' THEN 3
         END,
         u.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can access
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.engineer_name, u.color as user_color, u.created_at, u.updated_at,
              u.invitation_token, u.invitation_expires,
              COALESCE(u.color, e.color) as color, e.tasks_total
       FROM users u
       LEFT JOIN engineers e ON u.engineer_name = e.name
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only - can create admin, director, or engineer)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can create users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { email, name, role, password, engineer_name, color, sendInvitation, confirm } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ error: 'Email, name, and role are required' });
    }

    if (!['admin', 'director', 'engineer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin, director, or engineer' });
    }

    // For engineer role, engineer_name is required
    if (role === 'engineer' && !engineer_name) {
      return res.status(400).json({ error: 'engineer_name is required for engineer role' });
    }

    // Require confirmation if sending invitation
    if (sendInvitation && confirm !== true) {
      return res.status(400).json({ error: 'Confirmation required. Please set confirm: true to send invitation email.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if email already exists
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Generate invitation token if requested
      let invitationToken = null;
      let invitationExpires = null;
      if (sendInvitation) {
        invitationToken = crypto.randomBytes(32).toString('hex');
        invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }

      // Hash password if provided, otherwise null (for invitation)
      const passwordHash = password 
        ? await bcrypt.hash(password, 10)
        : sendInvitation 
          ? null 
          : await bcrypt.hash('password123', 10); // Default password

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, name, password_hash, role, engineer_name, color, invitation_token, invitation_expires)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, name, role, engineer_name, color, created_at, invitation_token, invitation_expires`,
        [email.toLowerCase(), name, passwordHash, role, engineer_name || null, color || null, invitationToken, invitationExpires]
      );

      const userId = userResult.rows[0].id;

      // If engineer role, create or update engineer record
      if (role === 'engineer' && engineer_name) {
        await client.query(
          `INSERT INTO engineers (name, color, user_id) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (name) 
           DO UPDATE SET user_id = $3, color = $2`,
          [engineer_name, color || '#3b82f6', userId]
        );
      }

      await client.query('COMMIT');

      const user = userResult.rows[0];
      let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      // Ensure HTTPS in production (keep localhost as http for development)
      if (!frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
        frontendUrl = frontendUrl.replace(/^http:\/\//, 'https://');
      }
      const invitationLink = sendInvitation ? `${frontendUrl}/invite/${invitationToken}` : null;

      // Send invitation email if requested
      let emailSent = false;
      let emailError = null;
      if (sendInvitation && invitationLink && invitationExpires) {
        try {
          const { sendInvitationEmail } = await import('../utils/email');
          emailSent = await sendInvitationEmail({
            engineerName: user.name,
            engineerEmail: user.email,
            invitationLink,
            expiresAt: invitationExpires,
          });
        } catch (error: any) {
          emailError = error.message;
          console.error('Error sending invitation email:', error);
        }
      }

      res.status(201).json({
        ...user,
        invitationLink,
        emailSent,
        emailError,
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update user (admin only - can update any user)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can update users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { email, name, role, password, engineer_name, color } = req.body;

    // Prevent admin from changing their own role (security measure)
    if (parseInt(id) === req.user?.id && role && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current user
      const currentUser = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      if (currentUser.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      const oldUser = currentUser.rows[0];
      const oldEngineerName = oldUser.engineer_name;
      const oldRole = oldUser.role;

      // Check email uniqueness if changing email
      if (email && email.toLowerCase() !== oldUser.email) {
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), id]);
        if (existingUser.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      // Update user fields
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (email) {
        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(email.toLowerCase());
      }
      if (name) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }
      if (role && role !== oldRole) {
        updateFields.push(`role = $${paramIndex++}`);
        updateValues.push(role);
        
        // If changing from engineer to non-engineer, clear engineer_name
        if (oldRole === 'engineer' && role !== 'engineer') {
          updateFields.push(`engineer_name = NULL`);
        }
        // If changing to engineer, set engineer_name
        if (role === 'engineer' && engineer_name) {
          updateFields.push(`engineer_name = $${paramIndex++}`);
          updateValues.push(engineer_name);
        }
      } else if (engineer_name && oldUser.role === 'engineer') {
        updateFields.push(`engineer_name = $${paramIndex++}`);
        updateValues.push(engineer_name);
      }

      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        updateFields.push(`password_hash = $${paramIndex++}`);
        updateValues.push(passwordHash);
      }
      if (color !== undefined) {
        updateFields.push(`color = $${paramIndex++}`);
        updateValues.push(color || null);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length > 0) {
        updateValues.push(id);
        await client.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      // Handle engineer record updates
      if (oldUser.role === 'engineer') {
        const newEngineerName = engineer_name || name || oldEngineerName;
        
        if (oldEngineerName && newEngineerName !== oldEngineerName) {
          // Update engineer name and all related tasks
          await client.query('UPDATE engineers SET name = $1 WHERE name = $2', [newEngineerName, oldEngineerName]);
          await client.query('UPDATE tasks SET engineer = $1 WHERE engineer = $2', [newEngineerName, oldEngineerName]);
        }
        
        if (color) {
          await client.query('UPDATE engineers SET color = $1 WHERE name = $2', [color, newEngineerName || oldEngineerName]);
        }
      } else if (role === 'engineer' && engineer_name) {
        // User is being changed to engineer role
        const engineerResult = await client.query('SELECT id FROM engineers WHERE name = $1', [engineer_name]);
        if (engineerResult.rows.length > 0) {
          await client.query('UPDATE engineers SET user_id = $1, color = $2 WHERE name = $3', [id, color || '#3b82f6', engineer_name]);
        } else {
          await client.query('INSERT INTO engineers (name, color, user_id) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET user_id = $3, color = $2', [engineer_name, color || '#3b82f6', id]);
        }
      }

      await client.query('COMMIT');

      // Get updated user
      const updatedUser = await client.query(
        `SELECT u.id, u.email, u.name, u.role, u.engineer_name, u.color as user_color, u.created_at, u.updated_at,
                COALESCE(u.color, e.color) as color, e.tasks_total
         FROM users u
         LEFT JOIN engineers e ON u.engineer_name = e.name
         WHERE u.id = $1`,
        [id]
      );

      res.json(updatedUser.rows[0]);
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Delete user (admin only - can delete any user except themselves)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can delete users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user?.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get user info before deleting
      const userResult = await client.query('SELECT engineer_name, role FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      const engineerName = userResult.rows[0].engineer_name;
      const userRole = userResult.rows[0].role;

      // Delete user (this will cascade delete notifications)
      await client.query('DELETE FROM users WHERE id = $1', [id]);

      // If engineer, delete engineer record (this will cascade delete tasks)
      if (userRole === 'engineer' && engineerName) {
        await client.query('DELETE FROM engineers WHERE name = $1', [engineerName]);
      }

      await client.query('COMMIT');
      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Send invitation for any user (admin, director, engineer)
router.post('/:id/invite', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can send invitations
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { confirm } = req.body;

    // Require confirmation
    if (confirm !== true) {
      return res.status(400).json({ error: 'Confirmation required. Please set confirm: true to send invitation email.' });
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get user details before updating
    const userResult = await pool.query(
      'SELECT name, email, role FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Clear password hash and set invitation token
    await pool.query(
      'UPDATE users SET password_hash = NULL, invitation_token = $1, invitation_expires = $2 WHERE id = $3',
      [invitationToken, invitationExpires, id]
    );

    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    // Ensure HTTPS in production (keep localhost as http for development)
    if (!frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
      frontendUrl = frontendUrl.replace(/^http:\/\//, 'https://');
    }
    const invitationLink = `${frontendUrl}/invite/${invitationToken}`;

    // Send invitation email
    let emailSent = false;
    let emailError = null;
    try {
      const { sendInvitationEmail } = await import('../utils/email');
      emailSent = await sendInvitationEmail({
        engineerName: user.name,
        engineerEmail: user.email,
        invitationLink,
        expiresAt: invitationExpires,
      });
      if (!emailSent) {
        emailError = 'Email could not be sent. Please check SMTP configuration.';
      }
    } catch (err: any) {
      console.error('Error sending invitation email:', err);
      emailError = err.message || 'Failed to send email';
    }

    res.json({ 
      invitationLink, 
      expiresAt: invitationExpires,
      emailSent,
      emailError: emailError || undefined,
    });
  } catch (error: any) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password for any user (admin, director, engineer)
router.post('/:id/reset-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin can reset passwords
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    // If newPassword provided, use it; otherwise generate default
    const password = newPassword || 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1, invitation_token = NULL, invitation_expires = NULL WHERE id = $2',
      [passwordHash, id]
    );

    res.json({ message: 'Password reset successfully', defaultPassword: !newPassword });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

