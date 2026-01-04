import { Router, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest, authenticate } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendInvitationEmail } from '../utils/email';

const router = Router();

// Get all engineers (just the engineer records, with user info if available)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.id as user_id, u.email as user_email, u.name as user_name
       FROM engineers e
       LEFT JOIN users u ON e.user_id = u.id
       ORDER BY e.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get engineers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new engineer (just the engineer record)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }

    const result = await pool.query(
      'INSERT INTO engineers (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Engineer with this name already exists' });
    }
    console.error('Create engineer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all engineer users (users with role='engineer')
router.get('/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can access
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.engineer_name, u.created_at, u.invitation_token, u.invitation_expires,
              e.color, e.tasks_total
       FROM users u
       LEFT JOIN engineers e ON u.engineer_name = e.name
       WHERE u.role = 'engineer'
       ORDER BY u.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get engineer users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Preview invitation email for new engineer (before creating)
router.post('/users/preview', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can preview
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, email, sendInvitation } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (!sendInvitation) {
      return res.status(400).json({ error: 'Preview only available when sendInvitation is true' });
    }

    // Generate preview invitation link (not saved to DB)
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost'}/invite/${invitationToken}`;

    res.json({
      preview: {
        engineerName: name,
        engineerEmail: email.toLowerCase(),
        invitationLink,
        expiresAt: invitationExpires.toISOString(),
        expiresDate: invitationExpires.toLocaleDateString(),
        expiresTime: invitationExpires.toLocaleTimeString(),
      },
    });
  } catch (error: any) {
    console.error('Preview invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create engineer user (creates both user and engineer record)
router.post('/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can create
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, email, color, sendInvitation, confirm } = req.body;
    
    if (!name || !email || !color) {
      return res.status(400).json({ error: 'Name, email, and color are required' });
    }

    // Require confirmation if sending invitation
    if (sendInvitation && confirm !== true) {
      return res.status(400).json({ error: 'Confirmation required. Please set confirm: true to send invitation email.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate invitation token if requested
      let invitationToken = null;
      let invitationExpires = null;
      if (sendInvitation) {
        invitationToken = crypto.randomBytes(32).toString('hex');
        invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      }

      // Create user account first (we need the user id for the engineer record)
      const passwordHash = sendInvitation ? null : await bcrypt.hash('password123', 10);
      
      const userResult = await client.query(
        `INSERT INTO users (email, name, password_hash, role, engineer_name, invitation_token, invitation_expires)
         VALUES ($1, $2, $3, 'engineer', $4, $5, $6)
         RETURNING id, email, name, role, engineer_name, created_at, invitation_token, invitation_expires`,
        [email.toLowerCase(), name, passwordHash, name, invitationToken, invitationExpires]
      );

      const userId = userResult.rows[0].id;

      // Create or update engineer record with user_id
      await client.query(
        `INSERT INTO engineers (name, color, user_id) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (name) 
         DO UPDATE SET user_id = $3, color = $2`,
        [name, color, userId]
      );

      await client.query('COMMIT');

      const user = userResult.rows[0];
      const invitationLink = sendInvitation ? `${process.env.FRONTEND_URL || 'http://localhost'}/invite/${invitationToken}` : null;
      
      // Send invitation email if requested
      let emailSent = false;
      let emailError = null;
      if (sendInvitation && invitationLink && invitationExpires) {
        try {
          emailSent = await sendInvitationEmail({
            engineerName: name,
            engineerEmail: email.toLowerCase(),
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
      }
      
      res.status(201).json({
        ...user,
        invitationLink,
        emailSent,
        emailError: emailError || undefined,
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email or engineer name already exists' });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Create engineer user error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update engineer user
router.put('/users/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can update
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;
    const { name, email, color } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current user to find engineer_name
      const currentUser = await client.query('SELECT engineer_name FROM users WHERE id = $1', [id]);
      if (currentUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const oldEngineerName = currentUser.rows[0].engineer_name;

      // Update engineer record if name changed
      if (name && name !== oldEngineerName) {
        await client.query('UPDATE engineers SET name = $1, color = $2 WHERE name = $3', [name, color, oldEngineerName]);
        // Update all tasks referencing the old engineer name
        await client.query('UPDATE tasks SET engineer = $1 WHERE engineer = $2', [name, oldEngineerName]);
      } else if (color) {
        await client.query('UPDATE engineers SET color = $1 WHERE name = $2', [color, oldEngineerName || name]);
      }

      // Update user
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (name) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
        updateFields.push(`engineer_name = $${paramIndex++}`);
        updateValues.push(name);
      }
      if (email) {
        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(email.toLowerCase());
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);
        await client.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      await client.query('COMMIT');

      // Get updated user
      const result = await client.query(
        `SELECT u.id, u.email, u.name, u.role, u.engineer_name, u.created_at, u.invitation_token, u.invitation_expires,
                e.color, e.tasks_total
         FROM users u
         LEFT JOIN engineers e ON u.engineer_name = e.name
         WHERE u.id = $1`,
        [id]
      );

      res.json(result.rows[0]);
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email or engineer name already exists' });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Update engineer user error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Delete engineer user
router.delete('/users/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Admin and director can delete
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get engineer name before deleting
      const userResult = await client.query('SELECT engineer_name FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const engineerName = userResult.rows[0].engineer_name;

      // Delete user (this will cascade delete notifications)
      await client.query('DELETE FROM users WHERE id = $1', [id]);

      // Delete engineer record (this will cascade delete tasks)
      if (engineerName) {
        await client.query('DELETE FROM engineers WHERE name = $1', [engineerName]);
      }

      await client.query('COMMIT');
      res.json({ message: 'Engineer deleted successfully' });
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Delete engineer user error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Preview invitation email for existing engineer
router.post('/users/:id/invite/preview', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can preview
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { id } = req.params;

    // Get user details
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Generate preview invitation link (not saved to DB)
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost'}/invite/${invitationToken}`;

    res.json({
      preview: {
        engineerName: user.name,
        engineerEmail: user.email,
        invitationLink,
        expiresAt: invitationExpires.toISOString(),
        expiresDate: invitationExpires.toLocaleDateString(),
        expiresTime: invitationExpires.toLocaleTimeString(),
      },
    });
  } catch (error) {
    console.error('Preview invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate invitation link for engineer
router.post('/users/:id/invite', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can send invitations
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
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
      'SELECT name, email FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    await pool.query(
      'UPDATE users SET invitation_token = $1, invitation_expires = $2 WHERE id = $3',
      [invitationToken, invitationExpires, id]
    );

    const invitationLink = `${process.env.FRONTEND_URL || 'http://localhost'}/invite/${invitationToken}`;

    // Send invitation email
    let emailSent = false;
    let emailError = null;
    try {
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
  } catch (error) {
    console.error('Generate invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset engineer password
router.post('/users/:id/reset-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Only admin and director can reset passwords
    if (req.user?.role !== 'admin' && req.user?.role !== 'director') {
      return res.status(403).json({ error: 'Forbidden' });
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
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

