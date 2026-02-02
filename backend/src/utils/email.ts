import nodemailer from 'nodemailer';

/**
 * Ensure URL uses HTTPS in production (for non-localhost domains)
 * @param url - URL string
 * @returns URL with HTTPS if in production, otherwise unchanged
 */
const ensureHttpsInProduction = (url: string): string => {
  // Keep localhost as http for development
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return url;
  }
  // Replace http:// with https:// for production domains
  return url.replace(/^http:\/\//, 'https://');
};

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

export interface PasswordResetEmailData {
  userName: string;
  userEmail: string;
  resetLink: string;
  expiresAt: Date;
}

export interface TaskAssignedEmailData {
  engineerName: string;
  engineerEmail: string;
  taskDetails: {
    service: string;
    week: number;
    month: string;
    year: number;
    status: string;
    priority: string;
    description?: string;
  };
  assignedBy: string;
  portalUrl: string;
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
      subject: 'تذكير متابعة المهام',
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
      console.log(`Subject: دعوة للانضمام إلى نظام إدارة المهام`);
      console.log(`Engineer: ${data.engineerName}`);
      console.log(`Invitation Link: ${data.invitationLink}`);
      const { formatDateTimeSA } = require('./date');
      console.log(`Expires: ${formatDateTimeSA(data.expiresAt).dateTime}`);
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
      subject: 'دعوة للانضمام إلى نظام إدارة المهام',
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

  // Outlook-compatible email using table-based layout with Arabic text
  const html = `
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
                  <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: bold; color: #ffffff;">تذكير متابعة المهام</h1>
                  <p style="margin: 10px 0 0 0; padding: 0; font-size: 16px; color: #ffffff;">عزيزي/عزيزتي ${escapeHtml(data.engineerName)}،</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0 0 20px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    هذا تذكير متابعة بخصوص مهامك المعلقة والمهام قيد التنفيذ. يرجى مراجعة وتحديث حالة مهامك حسب الحاجة.
                  </p>
                </td>
              </tr>
              <!-- Summary Table -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb;">
                    <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size: 16px; color: #333333; font-weight: bold;">إجمالي المهام التي تحتاج إلى متابعة:</td>
                            <td align="left" style="font-size: 16px; color: #333333; font-weight: bold;">${totalCount}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size: 16px; color: #333333;">المهام المعلقة:</td>
                            <td align="left" style="font-size: 16px; color: #333333; font-weight: bold;">${pendingCount}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-size: 16px; color: #333333;">المهام قيد التنفيذ:</td>
                            <td align="left" style="font-size: 16px; color: #333333; font-weight: bold;">${inProgressCount}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 20px; line-height: 20px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Note Box -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eff6ff;">
                    <tr>
                      <td style="padding: 15px 20px;">
                        <p style="margin: 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                          <strong>ملاحظة:</strong> لديك ${totalCount} ${totalCount === 1 ? 'مهمة' : 'مهام'} تحتاج إلى متابعة. 
                          ${totalCount > 0 ? 'يرجى تسجيل الدخول إلى نظام إدارة المهام لعرض وتحديث مهامك.' : ''}
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
                    يرجى تسجيل الدخول إلى نظام إدارة المهام لتحديث حالة مهامك.
                  </p>
                  <p style="margin: 0; padding: 0; font-size: 12px; line-height: 1.6; color: #6b7280;">
                    هذا تذكير تلقائي. إذا كان لديك أي أسئلة، يرجى الاتصال بمديرك.
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

export const sendPasswordResetEmail = async (data: PasswordResetEmailData): Promise<boolean> => {
  try {
    // Check if SMTP is properly configured
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('\n========================================================');
      console.log('=== PASSWORD RESET EMAIL (SMTP not configured - would send) ===');
      console.log(`To: ${data.userEmail}`);
      console.log(`Subject: إعادة تعيين كلمة المرور`);
      console.log(`User: ${data.userName}`);
      console.log(`Reset Link: ${data.resetLink}`);
      const { formatDateTimeSA } = require('./date');
      console.log(`Expires: ${formatDateTimeSA(data.expiresAt).dateTime}`);
      console.log('========================================================\n');
      console.warn('[Email] SMTP not configured. Missing:', {
        SMTP_HOST: !smtpHost ? 'MISSING' : 'OK',
        SMTP_USER: !smtpUser ? 'MISSING' : 'OK',
        SMTP_PASS: !smtpPass ? 'MISSING' : 'OK',
      });
      return false; // Return false to indicate email was not sent
    }

    const transporter = createTransporter();

    // Try to verify connection (skip if fails, but log)
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
      to: data.userEmail,
      subject: 'إعادة تعيين كلمة المرور',
      html: generatePasswordResetEmailBody(data),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset email sent successfully to ${data.userEmail}`, {
      messageId: info.messageId,
      response: info.response,
    });
    return true;
  } catch (error: any) {
    console.error('[Email] Error sending password reset email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack,
    });
    return false;
  }
};

const generatePasswordResetEmailBody = (data: PasswordResetEmailData): string => {
  const { formatDateSA, formatTimeSA } = require('./date');
  const expiresDate = formatDateSA(data.expiresAt);
  const expiresTime = formatTimeSA(data.expiresAt);
  
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
                <td style="background-color: #5c7cfa; padding: 30px 20px; color: #ffffff; text-align: center;">
                  <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: bold; color: #ffffff;">إعادة تعيين كلمة المرور</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0 0 15px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    عزيزي/عزيزتي ${escapeHtml(data.userName)}،
                  </p>
                  <p style="margin: 0 0 25px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    لقد تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك في نظام إدارة المهام. يرجى النقر على الزر أدناه لإعادة تعيين كلمة المرور.
                  </p>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 25px; line-height: 25px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Button -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;" align="center">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background-color: #5c7cfa; padding: 12px 30px; border-radius: 5px;">
                        <a href="${data.resetLink}" style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">إعادة تعيين كلمة المرور</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 25px; line-height: 25px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Info Box -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
                    <tr>
                      <td style="padding: 15px 20px; background-color: #f9fafb;">
                        <p style="margin: 0 0 10px 0; padding: 0; font-size: 16px; font-weight: bold; color: #333333;">معلومات مهمة:</p>
                        <ul style="margin: 0 0 10px 0; padding-right: 20px; font-size: 16px; line-height: 1.8; color: #333333;">
                          <li>ستنتهي صلاحية رابط إعادة تعيين كلمة المرور في <strong>${expiresDate} الساعة ${expiresTime}</strong></li>
                          <li>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني</li>
                          <li>إذا لم يعمل الزر، يرجى نسخ ولصق هذا الرابط في المتصفح:</li>
                        </ul>
                        <p style="margin: 0; padding: 10px; background-color: #ffffff; word-break: break-all; font-size: 12px; color: #5c7cfa; border: 1px solid #e5e7eb;">
                          ${data.resetLink}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 20px; line-height: 20px; font-size: 1px;">&nbsp;</td></tr>
              <tr>
                <td style="padding: 0 20px 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    لأسباب أمنية، إذا لم تطلب إعادة تعيين كلمة المرور، يرجى الاتصال بالمسؤول فورًا.
                  </p>
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

export const sendTaskAssignedEmail = async (data: TaskAssignedEmailData): Promise<boolean> => {
  try {
    // Check if SMTP is properly configured
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('\n========================================================');
      console.log('=== TASK ASSIGNED EMAIL (SMTP not configured - would send) ===');
      console.log(`To: ${data.engineerEmail}`);
      console.log(`Subject: تم تعيين مهمة جديدة - ${data.taskDetails.service}`);
      console.log(`Engineer: ${data.engineerName}`);
      console.log(`Task: ${data.taskDetails.service} - Week ${data.taskDetails.week}, ${data.taskDetails.month} ${data.taskDetails.year}`);
      console.log(`Assigned by: ${data.assignedBy}`);
      console.log('========================================================\n');
      console.warn('[Email] SMTP not configured. Missing:', {
        SMTP_HOST: !smtpHost ? 'MISSING' : 'OK',
        SMTP_USER: !smtpUser ? 'MISSING' : 'OK',
        SMTP_PASS: !smtpPass ? 'MISSING' : 'OK',
      });
      return false;
    }

    const transporter = createTransporter();

    // Try to verify connection (skip if fails, but log)
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
      subject: `تم تعيين مهمة جديدة - ${data.taskDetails.service}`,
      html: generateTaskAssignedEmailBody(data),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Task assigned email sent successfully to ${data.engineerEmail}`, {
      messageId: info.messageId,
      response: info.response,
    });
    return true;
  } catch (error: any) {
    console.error('[Email] Error sending task assigned email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack,
    });
    return false;
  }
};

const generateTaskAssignedEmailBody = (data: TaskAssignedEmailData): string => {
  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  };
  
  const priorityLabels: Record<string, string> = {
    high: 'عالية',
    medium: 'متوسطة',
    low: 'منخفضة',
  };
  
  const statusLabels: Record<string, string> = {
    pending: 'معلقة',
    'in-progress': 'قيد التنفيذ',
    completed: 'مكتملة',
  };
  
  const priorityColor = priorityColors[data.taskDetails.priority] || '#6b7280';
  const priorityLabel = priorityLabels[data.taskDetails.priority] || data.taskDetails.priority;
  const statusLabel = statusLabels[data.taskDetails.status] || data.taskDetails.status;
  
  const portalUrl = ensureHttpsInProduction(data.portalUrl);
  
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
                <td style="background-color: #5c7cfa; padding: 30px 20px; color: #ffffff; text-align: center;">
                  <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: bold; color: #ffffff;">تم تعيين مهمة جديدة</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0 0 15px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    عزيزي/عزيزتي ${escapeHtml(data.engineerName)}،
                  </p>
                  <p style="margin: 0 0 25px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    تم تعيين مهمة جديدة لك من قبل <strong>${escapeHtml(data.assignedBy)}</strong>. يرجى مراجعة تفاصيل المهمة أدناه.
                  </p>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 25px; line-height: 25px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Task Details Box -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px;">
                    <tr>
                      <td style="padding: 20px;">
                        <h2 style="margin: 0 0 15px 0; padding: 0; font-size: 18px; font-weight: bold; color: #333333;">تفاصيل المهمة</h2>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <strong style="color: #6b7280; font-size: 16px;">الخدمة:</strong>
                              <span style="color: #333333; font-size: 16px; margin-right: 10px;">${escapeHtml(data.taskDetails.service)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <strong style="color: #6b7280; font-size: 16px;">الفترة:</strong>
                              <span style="color: #333333; font-size: 16px; margin-right: 10px;">الأسبوع ${data.taskDetails.week}، ${escapeHtml(data.taskDetails.month)} ${data.taskDetails.year}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <strong style="color: #6b7280; font-size: 16px;">الحالة:</strong>
                              <span style="color: #333333; font-size: 16px; margin-right: 10px;">${escapeHtml(statusLabel)}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                              <strong style="color: #6b7280; font-size: 16px;">الأولوية:</strong>
                              <span style="color: ${priorityColor}; font-size: 16px; font-weight: bold; margin-right: 10px;">${escapeHtml(priorityLabel)}</span>
                            </td>
                          </tr>
                          ${data.taskDetails.description ? `
                          <tr>
                            <td style="padding: 8px 0;">
                              <strong style="color: #6b7280; font-size: 16px;">الوصف:</strong>
                              <p style="color: #333333; font-size: 16px; margin: 5px 0 0 0; line-height: 1.8;">${escapeHtml(data.taskDetails.description)}</p>
                            </td>
                          </tr>
                          ` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 25px; line-height: 25px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Button -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;" align="center">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background-color: #5c7cfa; padding: 12px 30px; border-radius: 5px;">
                        <a href="${portalUrl}" style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">عرض المهمة في لوحة التحكم</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 20px; line-height: 20px; font-size: 1px;">&nbsp;</td></tr>
              <tr>
                <td style="padding: 0 20px 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    يرجى تسجيل الدخول إلى نظام إدارة المهام لعرض وتحديث هذه المهمة.
                  </p>
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

const generateInvitationEmailBody = (data: InvitationEmailData): string => {
  const { formatDateSA, formatTimeSA } = require('./date');
  const expiresDate = formatDateSA(data.expiresAt);
  const expiresTime = formatTimeSA(data.expiresAt);
  
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
                  <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: bold; color: #ffffff;">دعوة للانضمام إلى نظام إدارة المهام</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0 0 15px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    عزيزي/عزيزتي ${escapeHtml(data.engineerName)}،
                  </p>
                  <p style="margin: 0 0 25px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    لقد تمت دعوتك للانضمام إلى نظام إدارة المهام. يرجى النقر على الزر أدناه لإعداد حسابك وإنشاء كلمة المرور.
                  </p>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 25px; line-height: 25px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Button -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;" align="center">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background-color: #667eea; padding: 12px 30px; border-radius: 5px;">
                        <a href="${data.invitationLink}" style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">قبول الدعوة وإنشاء كلمة المرور</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 25px; line-height: 25px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Info Box -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
                    <tr>
                      <td style="padding: 15px 20px; background-color: #f9fafb;">
                        <p style="margin: 0 0 10px 0; padding: 0; font-size: 16px; font-weight: bold; color: #333333;">معلومات مهمة:</p>
                        <ul style="margin: 0 0 10px 0; padding-right: 20px; font-size: 16px; line-height: 1.8; color: #333333;">
                          <li>ستنتهي صلاحية رابط الدعوة في <strong>${expiresDate} الساعة ${expiresTime}</strong></li>
                          <li>إذا لم يعمل الزر، يرجى نسخ ولصق هذا الرابط في المتصفح:</li>
                        </ul>
                        <p style="margin: 0; padding: 10px; background-color: #ffffff; word-break: break-all; font-size: 12px; color: #667eea; border: 1px solid #e5e7eb;">
                          ${data.invitationLink}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 20px; line-height: 20px; font-size: 1px;">&nbsp;</td></tr>
              <tr>
                <td style="padding: 0 20px 30px 20px; background-color: #ffffff;">
                  <p style="margin: 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    إذا لم تتوقع هذه الدعوة، يرجى تجاهل هذا البريد الإلكتروني أو الاتصال بالمسؤول.
                  </p>
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
  const portalUrl = ensureHttpsInProduction(data.portalUrl || process.env.FRONTEND_URL || 'http://localhost:5173');
  
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
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 30px; line-height: 30px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Portal Link -->
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff;" align="center">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background-color: #667eea; padding: 12px 30px; border-radius: 5px;">
                        <a href="${portalUrl}" style="display: inline-block; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold;">الوصول إلى نظام إدارة المهام</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 20px; line-height: 20px; font-size: 1px;">&nbsp;</td></tr>
              <tr>
                <td style="padding: 0 20px; background-color: #ffffff; text-align: center;">
                  <p style="margin: 0; padding: 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                    رابط النظام: <a href="${portalUrl}" style="color: #667eea; text-decoration: none;">${portalUrl}</a>
                  </p>
                </td>
              </tr>
              <!-- Spacer Row -->
              <tr><td style="height: 40px; line-height: 40px; font-size: 1px;">&nbsp;</td></tr>
              <!-- Signature -->
              <tr>
                <td style="padding: 20px; background-color: #ffffff; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0 0 5px 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    مدير إدارة عمليات الأمن السيبراني
                  </p>
                  <p style="margin: 0; padding: 0; font-size: 16px; line-height: 1.8; color: #333333;">
                    المهندس / ناصر السليم
                  </p>
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

