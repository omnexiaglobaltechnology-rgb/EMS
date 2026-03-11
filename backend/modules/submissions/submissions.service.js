const Task = require('../../models/Task');
const Submission = require('../../models/Submission');

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

exports.createSubmission = async ({ taskId, submittedById, externalLink, comment, file }) => {
  console.log('[createSubmission] Starting with:', { taskId, submittedById });
  
  const task = await Task.findById(taskId);
  console.log('[createSubmission] Task found:', task ? `${task._id} - ${task.title}` : 'NOT FOUND');
  if (!task) throw new Error('Task not found');

  if (externalLink && !isValidUrl(externalLink)) {
    console.log('[createSubmission] Invalid URL');
    throw new Error('Invalid external link');
  }

  const fileUrl = file && file.filename ? `/uploads/${file.filename}` : null;
  console.log('[createSubmission] File URL:', fileUrl);

  const submission = await Submission.create({
    taskId,
    submittedById,
    versionNo: task.versionNo,
    fileUrl,
    externalLink,
    comment
  });

  const populated = await Submission.findById(submission._id)
    .populate('submittedById')
    .populate('taskId');

  console.log('[createSubmission] Submission created:', { id: submission._id, taskId: submission.taskId });
  return populated;
};

exports.getByTask = async (taskId) => {
  try {
    const submissions = await Submission.find({ taskId })
      .populate('submittedById')
      .populate('reviewedById')
      .populate('taskId')
      .sort({ createdAt: -1 })
      .lean();
    return submissions || [];
  } catch (error) {
    console.error(`Error fetching submissions for task ${taskId}:`, error);
    throw new Error(`Failed to fetch submissions for task ${taskId}`);
  }
};

exports.getSubmissionHistory = async (taskId, submittedById) => {
  return Submission.find({
    taskId,
    submittedById
  })
    .populate('submittedById')
    .populate('reviewedById')
    .populate('taskId')
    .sort({ createdAt: -1 })
    .lean();
};

exports.getSubmissionById = async (id) => {
  const submission = await Submission.findById(id)
    .populate('submittedById')
    .populate('reviewedById')
    .populate({
      path: 'taskId',
      populate: {
        path: 'assignedToId assignedById'
      }
    })
    .lean();

  if (!submission) {
    throw new Error('Submission not found');
  }

  return submission;
};

exports.reviewSubmission = async (id, { reviewerId, status, reviewComment }) => {
  console.log('[reviewSubmission] Starting with:', { id, reviewerId, status });
  
  const valid = ['approved', 'rejected', 'pending'];
  if (!valid.includes(status)) {
    console.log('[reviewSubmission] Invalid status:', status);
    throw new Error(`Invalid status: ${status}. Must be one of: ${valid.join(', ')}`);
  }

  const submission = await Submission.findById(id);

  if (!submission) {
    console.log('[reviewSubmission] Submission not found:', id);
    throw new Error('Submission not found');
  }

  console.log('[reviewSubmission] Updating submission:', { id, oldStatus: submission.status, newStatus: status });

  const updated = await Submission.findByIdAndUpdate(
    id,
    {
      reviewedById: reviewerId,
      status,
      reviewComment: reviewComment || null,
      updatedAt: new Date()
    },
    { new: true }
  )
    .populate('submittedById')
    .populate('reviewedById')
    .populate('taskId');

  console.log('[reviewSubmission] Successfully updated submission:', updated?._id);
  return updated;
};

exports.deleteSubmission = async (id) => {
  const submission = await Submission.findById(id);

  if (!submission) {
    throw new Error('Submission not found');
  }

  return Submission.findByIdAndDelete(id);
};
