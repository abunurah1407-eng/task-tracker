import nodemailer from 'nodemailer';

interface Task {
  id: number;
  service: string;
  engineer: string;
  week: number;
  month: string;
  year: number;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  description?: string;
}

// Email transporter configuration
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || '';
  const smtpPort = parseInt(process.env.SMTP_PORT || '25');
  const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'SSL' || smtpPort === 465;
  
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true for 465, false for other ports (25, 587)
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    // For port 25 with SSL, we may need to set requireTLS
    requireTLS: smtpSecure && smtpPort === 25,
    tls: {
      // Do not fail on invalid certificates (useful for internal mail servers)
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'true',
    },
  });
};

export interface FollowUpEmailData {
  engineerName: string;
  engineerEmail: string;
  pendingTasks: Task[];
  inProgressTasks: Task[];
}

export interface InvitationEmailData {
  engineerName: string;
  engineerEmail: string;
  invitationLink: string;
  expiresAt: Date;
}

export const sendFollowUpEmail = async (data: FollowUpEmailData): Promise<boolean> => {
  try {
    // If no SMTP credentials are configured, log the email instead
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n========================================================');
      console.log('=== FOLLOW-UP EMAIL (SMTP not configured - would send) ===');
      console.log(`To: ${data.engineerEmail}`);
      console.log(`Subject: Task Follow-up: Pending and In-Progress Tasks`);
      console.log(`Engineer: ${data.engineerName}`);
      console.log(`Pending Tasks: ${data.pendingTasks.length}`);
      console.log(`In Progress Tasks: ${data.inProgressTasks.length}`);
      console.log('========================================================\n');
      // Still return true to indicate the email was "processed"
      return true; // Return true for development/testing
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.engineerEmail,
      subject: 'Task Follow-up: Pending and In-Progress Tasks',
      html: generateEmailBody(data),
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Follow-up email sent successfully to ${data.engineerEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending follow-up email:', error);
    return false;
  }
};

export const sendInvitationEmail = async (data: InvitationEmailData): Promise<boolean> => {
  try {
    // If no SMTP credentials are configured, log the email instead
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n========================================================');
      console.log('=== INVITATION EMAIL (SMTP not configured - would send) ===');
      console.log(`To: ${data.engineerEmail}`);
      console.log(`Subject: Task Tracker - Account Invitation`);
      console.log(`Engineer: ${data.engineerName}`);
      console.log(`Invitation Link: ${data.invitationLink}`);
      console.log(`Expires: ${data.expiresAt.toLocaleString()}`);
      console.log('========================================================\n');
      return true; // Return true for development/testing
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.engineerEmail,
      subject: 'Task Tracker - Account Invitation',
      html: generateInvitationEmailBody(data),
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Invitation email sent successfully to ${data.engineerEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};

const generateEmailBody = (data: FollowUpEmailData): string => {
  const pendingCount = data.pendingTasks.length;
  const inProgressCount = data.inProgressTasks.length;
  const totalCount = pendingCount + inProgressCount;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .task-section { margin-bottom: 30px; }
        .task-section h2 { color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
        .task-item { background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .task-item.pending { border-left-color: #f59e0b; }
        .task-item.in-progress { border-left-color: #3b82f6; }
        .task-service { font-weight: bold; color: #1f2937; font-size: 16px; margin-bottom: 5px; }
        .task-details { color: #6b7280; font-size: 14px; }
        .task-meta { display: flex; gap: 15px; margin-top: 10px; font-size: 12px; color: #9ca3af; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-in-progress { background: #dbeafe; color: #1e40af; }
        .summary { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .summary-item:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Task Follow-up Reminder</h1>
          <p>Dear ${data.engineerName},</p>
        </div>
        <div class="content">
          <p>This is a follow-up reminder regarding your pending and in-progress tasks. Please review and update the status of your tasks as needed.</p>
          
          <div class="summary">
            <div class="summary-item">
              <span><strong>Total Tasks Requiring Attention:</strong></span>
              <span><strong>${totalCount}</strong></span>
            </div>
            <div class="summary-item">
              <span>Pending Tasks:</span>
              <span>${pendingCount}</span>
            </div>
            <div class="summary-item">
              <span>In Progress Tasks:</span>
              <span>${inProgressCount}</span>
            </div>
          </div>
  `;

  if (data.pendingTasks.length > 0) {
    html += `
          <div class="task-section">
            <h2>Pending Tasks (${pendingCount})</h2>
    `;
    data.pendingTasks.forEach((task) => {
      html += `
            <div class="task-item pending">
              <div class="task-service">${escapeHtml(task.service)}</div>
              ${task.description ? `<div class="task-details">${escapeHtml(task.description)}</div>` : ''}
              <div class="task-meta">
                <span><strong>Week:</strong> ${task.week}</span>
                <span><strong>Month:</strong> ${task.month}</span>
                <span><strong>Year:</strong> ${task.year}</span>
                <span><strong>Priority:</strong> ${task.priority}</span>
                <span class="badge badge-pending">Pending</span>
              </div>
            </div>
      `;
    });
    html += `</div>`;
  }

  if (data.inProgressTasks.length > 0) {
    html += `
          <div class="task-section">
            <h2>In Progress Tasks (${inProgressCount})</h2>
    `;
    data.inProgressTasks.forEach((task) => {
      html += `
            <div class="task-item in-progress">
              <div class="task-service">${escapeHtml(task.service)}</div>
              ${task.description ? `<div class="task-details">${escapeHtml(task.description)}</div>` : ''}
              <div class="task-meta">
                <span><strong>Week:</strong> ${task.week}</span>
                <span><strong>Month:</strong> ${task.month}</span>
                <span><strong>Year:</strong> ${task.year}</span>
                <span><strong>Priority:</strong> ${task.priority}</span>
                <span class="badge badge-in-progress">In Progress</span>
              </div>
            </div>
      `;
    });
    html += `</div>`;
  }

  html += `
          <div class="footer">
            <p>Please log in to the Task Tracker system to update your task status.</p>
            <p>This is an automated reminder. If you have any questions, please contact your director.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

const generateInvitationEmailBody = (data: InvitationEmailData): string => {
  const expiresDate = data.expiresAt.toLocaleDateString();
  const expiresTime = data.expiresAt.toLocaleTimeString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #5568d3; }
        .info-box { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Task Tracker - Account Invitation</h1>
        </div>
        <div class="content">
          <p>Dear ${escapeHtml(data.engineerName)},</p>
          <p>You have been invited to join the Task Tracker system. Please click the button below to set up your account and create your password.</p>
          
          <div style="text-align: center;">
            <a href="${data.invitationLink}" class="button">Accept Invitation & Set Password</a>
          </div>
          
          <div class="info-box">
            <p><strong>Important Information:</strong></p>
            <ul>
              <li>This invitation link will expire on <strong>${expiresDate} at ${expiresTime}</strong></li>
              <li>If the button doesn't work, copy and paste this link into your browser:</li>
            </ul>
            <p style="word-break: break-all; color: #667eea;">${data.invitationLink}</p>
          </div>
          
          <p>If you did not expect this invitation, please ignore this email or contact your administrator.</p>
          
          <div class="footer">
            <p>This is an automated email from the Task Tracker system.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

