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
  const smtpSecureEnv = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === 'SSL';
  
  // Port 465 uses direct SSL (secure: true)
  // Port 25: Based on testing, mailr.etec.gov.sa requires plain connection (no TLS/STARTTLS)
  // Port 587 typically uses STARTTLS (secure: false, requireTLS: true)
  const useDirectSSL = smtpPort === 465;
  
  // For port 25, use plain connection (no TLS) as the mail server doesn't support STARTTLS
  // For port 587, use STARTTLS if SSL is requested
  const usePlainConnection = smtpPort === 25;
  const useSTARTTLS = smtpPort === 587 && smtpSecureEnv;
  
  // Base configuration - match the exact working test script configuration
  const transporterConfig: any = {
    host: smtpHost,
    port: smtpPort,
    secure: false, // Always false for port 25 (plain connection)
    requireTLS: false, // Always false for port 25 (plain connection, no STARTTLS)
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    tls: {
      // Always include TLS options with rejectUnauthorized: false (matches working test script)
      rejectUnauthorized: false,
    },
  };

  // Override for port 465 (direct SSL)
  if (useDirectSSL) {
    transporterConfig.secure = true;
  }
  
  // Override for port 587 with STARTTLS
  if (useSTARTTLS) {
    transporterConfig.requireTLS = true;
  }
  
  return nodemailer.createTransport(transporterConfig);
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
    // Check if SMTP is properly configured
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('\n========================================================');
      console.log('=== INVITATION EMAIL (SMTP not configured - would send) ===');
      console.log(`To: ${data.engineerEmail}`);
      console.log(`Subject: Task Tracker - Account Invitation`);
      console.log(`Engineer: ${data.engineerName}`);
      console.log(`Invitation Link: ${data.invitationLink}`);
      console.log(`Expires: ${data.expiresAt.toLocaleString()}`);
      console.log('========================================================\n');
      console.warn('[Email] SMTP not configured. Missing:', {
        SMTP_HOST: !smtpHost ? 'MISSING' : 'OK',
        SMTP_USER: !smtpUser ? 'MISSING' : 'OK',
        SMTP_PASS: !smtpPass ? 'MISSING' : 'OK',
      });
      return false; // Return false to indicate email was not sent
    }

    const transporter = createTransporter();

    // Try to verify connection (skip if fails, but log) - matches test script behavior
    try {
      await transporter.verify();
      console.log('[Email] SMTP connection verified successfully');
    } catch (verifyError: any) {
      const errorMessage = verifyError.message || '';
      console.log('[Email] SMTP verification failed (this is OK for plain connections):', errorMessage);
      console.log('[Email] Proceeding with email send anyway...');
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: data.engineerEmail,
      subject: 'Task Tracker - Account Invitation',
      html: generateInvitationEmailBody(data),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Invitation email sent successfully to ${data.engineerEmail}`, {
      messageId: info.messageId,
      response: info.response,
    });
    return true;
  } catch (error: any) {
    console.error('[Email] Error sending invitation email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack,
    });
    return false;
  }
};

const generateEmailBody = (data: FollowUpEmailData): string => {
  const pendingCount = data.pendingTasks.length;
  const inProgressCount = data.inProgressTasks.length;
  const totalCount = pendingCount + inProgressCount;

  // Outlook-compatible email using table-based layout
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="background-color: #667eea; padding: 30px 20px; color: #ffffff;">
                  <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: bold; color: #ffffff;">Task Follow-up Reminder</h1>
                  <p style="margin: 10px 0 0 0; padding: 0; font-size: 16px; color: #ffffff;">Dear ${escapeHtml(data.engineerName)},</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0 0 20px 0; padding: 0; font-size: 14px; line-height: 1.6; color: #333333;">
                    This is a follow-up reminder regarding your pending and in-progress tasks. Please review and update the status of your tasks as needed.
                  </p>
                  
                  <!-- Summary Table -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size: 14px; color: #333333; font-weight: bold;">Total Tasks Requiring Attention:</td>
                            <td align="right" style="font-size: 14px; color: #333333; font-weight: bold;">${totalCount}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size: 14px; color: #333333;">Pending Tasks:</td>
                            <td align="right" style="font-size: 14px; color: #333333; font-weight: bold;">${pendingCount}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size: 14px; color: #333333;">In Progress Tasks:</td>
                            <td align="right" style="font-size: 14px; color: #333333; font-weight: bold;">${inProgressCount}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Note Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eff6ff; border-left: 4px solid #3b82f6; margin-top: 20px;">
                    <tr>
                      <td style="padding: 15px 20px;">
                        <p style="margin: 0; padding: 0; font-size: 14px; line-height: 1.6; color: #333333;">
                          <strong>Note:</strong> You have ${totalCount} task${totalCount !== 1 ? 's' : ''} requiring your attention. 
                          ${totalCount > 0 ? 'Please log in to the Task Tracker system to view and update your tasks.' : ''}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0 0 10px 0; padding: 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                    Please log in to the Task Tracker system to update your task status.
                  </p>
                  <p style="margin: 0; padding: 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                    This is an automated reminder. If you have any questions, please contact your director.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return html;
};

const generateInvitationEmailBody = (data: InvitationEmailData): string => {
  const expiresDate = data.expiresAt.toLocaleDateString();
  const expiresTime = data.expiresAt.toLocaleTimeString();
  
  // Outlook-compatible email using table-based layout
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="background-color: #667eea; padding: 30px 20px; color: #ffffff; text-align: center;">
                  <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: bold; color: #ffffff;">Task Tracker - Account Invitation</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0 0 15px 0; padding: 0; font-size: 14px; line-height: 1.6; color: #333333;">
                    Dear ${escapeHtml(data.engineerName)},
                  </p>
                  <p style="margin: 0 0 25px 0; padding: 0; font-size: 14px; line-height: 1.6; color: #333333;">
                    You have been invited to join the Task Tracker system. Please click the button below to set up your account and create your password.
                  </p>
                  
                  <!-- Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0;">
                    <tr>
                      <td align="center">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background-color: #667eea; padding: 12px 30px; border-radius: 5px;">
                              <a href="${data.invitationLink}" style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">Accept Invitation & Set Password</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-left: 4px solid #667eea; margin: 25px 0;">
                    <tr>
                      <td style="padding: 15px 20px; background-color: #f9fafb;">
                        <p style="margin: 0 0 10px 0; padding: 0; font-size: 14px; font-weight: bold; color: #333333;">Important Information:</p>
                        <ul style="margin: 0 0 10px 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #333333;">
                          <li>This invitation link will expire on <strong>${expiresDate} at ${expiresTime}</strong></li>
                          <li>If the button doesn't work, copy and paste this link into your browser:</li>
                        </ul>
                        <p style="margin: 0; padding: 10px; background-color: #ffffff; word-break: break-all; font-size: 12px; color: #667eea; border: 1px solid #e5e7eb;">
                          ${data.invitationLink}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Access Note -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 25px 0;">
                    <tr>
                      <td style="padding: 15px 20px;">
                        <p style="margin: 0; padding: 0; font-size: 14px; line-height: 1.6; color: #333333;">
                          <strong>⚠️ Access Note:</strong> This application is accessible from <strong>Tower jump server - CS only</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0 0 0; padding: 0; font-size: 14px; line-height: 1.6; color: #333333;">
                    If you did not expect this invitation, please ignore this email or contact your administrator.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0 0 10px 0; padding: 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                    This is an automated email from the Task Tracker system.
                  </p>
                  <p style="margin: 0; padding: 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                    Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export interface WeeklyReminderEmailData {
  portalUrl: string;
  testEmail?: string; // Optional: if provided, send only to this email (for testing)
  directorName?: string; // Optional: director name for email footer
}

export const sendWeeklyReminderEmail = async (data: WeeklyReminderEmailData): Promise<boolean> => {
  try {
    // If no SMTP credentials are configured, log the email instead
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n========================================================');
      console.log('=== WEEKLY REMINDER EMAIL (SMTP not configured - would send) ===');
      console.log('Subject: إضافة المهام : تذكير لطيف');
      console.log('Portal URL:', data.portalUrl);
      console.log('========================================================\n');
      return true; // Return true for development/testing
    }

    const transporter = createTransporter();

    // Try to verify connection (skip if fails, but log) - matches test script behavior
    try {
      await transporter.verify();
      console.log('[Email] SMTP connection verified successfully');
    } catch (verifyError: any) {
      const errorMessage = verifyError.message || '';
      console.log('[Email] SMTP verification failed (this is OK for plain connections):', errorMessage);
      console.log('[Email] Proceeding with email send anyway...');
    }

    // If testEmail is provided, send only to that address (for testing)
    if (data.testEmail) {
      const emailSubject = 'إضافة المهام : تذكير لطيف';
      const emailBody = generateWeeklyReminderEmailBody(data);
      
      try {
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: data.testEmail,
          subject: emailSubject,
          html: emailBody,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Email] Test weekly reminder sent successfully to ${data.testEmail}`);
        return true;
      } catch (error: any) {
        console.error(`[Email] Error sending test weekly reminder to ${data.testEmail}:`, error.message);
        return false;
      }
    }

    // Get all engineers with email addresses
    const { pool } = await import('../config/database');
    const engineersResult = await pool.query(
      `SELECT DISTINCT u.email, u.name
       FROM users u
       JOIN engineers e ON e.user_id = u.id
       WHERE u.role = 'engineer' AND u.email IS NOT NULL AND u.email != ''`
    );

    if (engineersResult.rows.length === 0) {
      console.log('[Email] No engineers with email addresses found');
      return true;
    }

    const emailSubject = 'إضافة المهام : تذكير لطيف';
    const emailBody = generateWeeklyReminderEmailBody(data);

    let successCount = 0;
    let failCount = 0;

    for (const engineer of engineersResult.rows) {
      try {
        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: engineer.email,
          subject: emailSubject,
          html: emailBody,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Email] Weekly reminder sent successfully to ${engineer.email} (${engineer.name})`);
        successCount++;
      } catch (error: any) {
        console.error(`[Email] Error sending weekly reminder to ${engineer.email}:`, error.message);
        failCount++;
      }
    }

    console.log(`[Email] Weekly reminder email sending completed. Success: ${successCount}, Failed: ${failCount}`);
    return successCount > 0;
  } catch (error: any) {
    console.error('[Email] Error sending weekly reminder emails:', error);
    return false;
  }
};

const generateWeeklyReminderEmailBody = (data: WeeklyReminderEmailData): string => {
  const portalUrl = data.portalUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Outlook-compatible email using table-based layout with Arabic text
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; direction: rtl;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="background-color: #667eea; padding: 30px 20px; color: #ffffff; text-align: center;">
                  <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: bold; color: #ffffff;">إضافة المهام : تذكير لطيف</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0 0 15px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    أيها الفريق الرائع،
                  </p>
                  <p style="margin: 0 0 15px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    أعلم تمامًا مدى انشغالكم وضغط العمل، وأقدّر جهودكم الكبيرة.
                  </p>
                  <p style="margin: 0 0 15px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    حفاظًا على حقوقكم وضمان توثيق إنجازاتكم، أرجو منكم التكرم بإضافة مهام الأسبوع المنصرم في نظام إدارة المهام في أقرب فرصة.
                  </p>
                  <p style="margin: 20px 0 0 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    شكرًا لكم جزيل الشكر، ومع خالص التقدير
                  </p>
                  <p style="margin: 10px 0 0 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    يوم سعيد
                  </p>
                  
                  <!-- Portal Link -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background-color: #667eea; padding: 12px 30px; border-radius: 5px;">
                              <a href="${portalUrl}" style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">الوصول إلى نظام إدارة المهام</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0 0 0; padding: 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                    رابط النظام: <a href="${portalUrl}" style="color: #667eea; text-decoration: none;">${portalUrl}</a>
                  </p>
                  
                  <!-- Access Note -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 25px 0;">
                    <tr>
                      <td style="padding: 15px 20px;">
                        <p style="margin: 0; padding: 0; font-size: 14px; line-height: 1.6; color: #333333;">
                          <strong>⚠️ Access Note:</strong> This application is accessible from <strong>Tower jump server - CS only</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Signature -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 40px 0 20px 0; padding: 20px 0; border-top: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 0; text-align: center;">
                        <p style="margin: 0 0 5px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                          مدير إدارة عمليات الأمن السيبراني
                        </p>
                        <p style="margin: 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                          المهندس / ناصر السليم
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0 0 10px 0; padding: 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                    هذا بريد إلكتروني تلقائي من نظام إدارة المهام.
                  </p>
                  <p style="margin: 0; padding: 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                    يرجى عدم الرد على هذا البريد الإلكتروني.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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

