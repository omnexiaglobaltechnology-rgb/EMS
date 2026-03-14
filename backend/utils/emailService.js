const nodemailer = require('nodemailer');

// Configure the transporter with provided Gmail credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'omnexiahrteam@gmail.com',
    pass: 'zvim kxuz vnbp wkmj',
  },
});

/**
 * Sends a meeting notification email to a single user.
 * 
 * @param {Object} recipient - User object with personalEmail and name
 * @param {Object} meeting - Meeting object with title, date, time, and link
 * @param {Object} creator - User object who scheduled the meeting
 */
const sendMeetingNotification = async (recipient, meeting, creator) => {
  if (!recipient.personalEmail) {
    console.warn(`[EmailService] No personal email found for user: ${recipient.name || recipient._id}`);
    return;
  }

  const mailOptions = {
    from: '"EMS Notifications" <omnexiahrteam@gmail.com>',
    to: recipient.personalEmail,
    subject: `New Meeting Scheduled: ${meeting.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5;">New Meeting Assigned</h2>
        <p>Hello <strong>${recipient.name || 'User'}</strong>,</p>
        <p>You have been invited to a new meeting scheduled by <strong>${creator.name}</strong>.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Title:</strong> ${meeting.title}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${meeting.date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${meeting.time}</p>
          <p style="margin: 5px 0;"><strong>Platform:</strong> ${meeting.platform || 'EMS Meet'}</p>
        </div>

        ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}

        <div style="margin-top: 30px; text-align: center;">
          <a href="${meeting.link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Meeting</a>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #6b7280; border-top: 1px solid #eee; padding-top: 15px;">
          This is an automated notification from the Employee Management System. Please do not reply to this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Notification sent to ${recipient.personalEmail}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EmailService] ERROR sending to ${recipient.personalEmail}:`, error.message);
    throw error;
  }
};

/**
 * Batch sends meeting notifications to multiple invitees.
 */
const sendBulkMeetingNotifications = async (invitees, meeting, creator) => {
  const promises = invitees
    .filter(u => u.personalEmail)
    .map(u => sendMeetingNotification(u, meeting, creator));
  
  return Promise.allSettled(promises);
};

module.exports = {
  sendMeetingNotification,
  sendBulkMeetingNotifications,
};
