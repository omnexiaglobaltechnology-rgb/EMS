const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendTaskEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: `"EMS Task System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

exports.notifyTaskAssignment = async (user, task, assigner) => {
  const subject = `New Task Assigned: ${task.title}`;
  const text = `Hi ${user.name},\n\nYou have been assigned a new task: ${task.title} by ${assigner.name}.\nDue Date: ${new Date(task.dueDate).toLocaleDateString()}\n\nBest regards,\nEMS Team`;
  const html = `<p>Hi ${user.name},</p><p>You have been assigned a new task: <strong>${task.title}</strong> by ${assigner.name}.</p><p>Due Date: ${new Date(task.dueDate).toLocaleDateString()}</p><p>Best regards,<br>EMS Team</p>`;
  await sendTaskEmail(user.email, subject, text, html);
};

exports.notifyTaskDelegation = async (user, task, delegator) => {
  const subject = `Task Delegated: ${task.title}`;
  const text = `Hi ${user.name},\n\nA task has been delegated to you: ${task.title} by ${delegator.name}.\nDue Date: ${new Date(task.dueDate).toLocaleDateString()}\n\nBest regards,\nEMS Team`;
  const html = `<p>Hi ${user.name},</p><p>A task has been delegated to you: <strong>${task.title}</strong> by ${delegator.name}.</p><p>Due Date: ${new Date(task.dueDate).toLocaleDateString()}</p><p>Best regards,<br>EMS Team</p>`;
  await sendTaskEmail(user.email, subject, text, html);
};

exports.notifyTaskSubmission = async (user, task, submitter) => {
  const subject = `Task Submitted: ${task.title}`;
  const text = `Hi ${user.name},\n\nA task has been submitted for review: ${task.title} by ${submitter.name}.\n\nBest regards,\nEMS Team`;
  const html = `<p>Hi ${user.name},</p><p>A task has been submitted for review: <strong>${task.title}</strong> by ${submitter.name}.</p><p>Best regards,<br>EMS Team</p>`;
  await sendTaskEmail(user.email, subject, text, html);
};

exports.notifyTaskReview = async (user, task, reviewer, status) => {
  const subject = `Task Review: ${task.title} (${status})`;
  const text = `Hi ${user.name},\n\nYour task "${task.title}" has been reviewed by ${reviewer.name}.\nStatus: ${status}\n\nBest regards,\nEMS Team`;
  const html = `<p>Hi ${user.name},</p><p>Your task "<strong>${task.title}</strong>" has been reviewed by ${reviewer.name}.</p><p>Status: <strong>${status}</strong></p><p>Best regards,<br>EMS Team</p>`;
  await sendTaskEmail(user.email, subject, text, html);
};
