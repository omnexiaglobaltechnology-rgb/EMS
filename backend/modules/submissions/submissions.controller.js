const submissionsService = require('./submissions.service');

exports.create = async (req, res) => {
  try {
    console.log('[create] Starting submission creation...');
    console.log('[create] Body:', { taskId: req.body?.taskId, submittedById: req.user?.id });
    console.log('[create] File:', req.file ? { filename: req.file.filename, mimetype: req.file.mimetype } : 'NO FILE');
    
    // Validate required fields
    if (!req.body.taskId) {
      console.log('[create] Error: taskId missing');
      return res.status(400).json({ error: 'taskId is required' });
    }
    if (!req.user?.id) {
      console.log('[create] Error: submittedById missing');
      return res.status(400).json({ error: 'Authenticated user is required' });
    }

    const data = {
      taskId: req.body.taskId,
      submittedById: req.user.id,
      externalLink: req.body.externalLink,
      comment: req.body.comment,
      file: req.file
    };

    console.log('[create] Calling service with data:', { taskId: data.taskId, submittedById: data.submittedById });
    const submission = await submissionsService.createSubmission(data);
    console.log('[create] Submission created:', submission?.id);
    res.status(201).json(submission);
  } catch (err) {
    console.error('[create] ERROR:', err.message);
    console.error('[create] ERROR stack:', err.stack);
    res.status(400).json({ error: err.message });
  }
};

exports.getByTask = async (req, res) => {
  try {
    console.log('[getByTask] Fetching submissions for task:', req.params.taskId);
    const subs = await submissionsService.getByTask(req.params.taskId);
    console.log('[getByTask] Found submissions:', subs?.length || 0);
    res.json(subs);
  } catch (err) {
    console.error("GET BY TASK ERROR:", err.message);
    res.status(400).json({ error: err.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await submissionsService.getSubmissionById(req.params.id);
    res.json(submission);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.getSubmissionHistory = async (req, res) => {
  try {
    const { taskId, submittedById } = req.params;
    const history = await submissionsService.getSubmissionHistory(taskId, submittedById);
    res.json(history);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.review = async (req, res) => {
  try {
    console.log('[review] Starting review process...');
    console.log('[review] Submission ID:', req.params.id);
    console.log('[review] Review data:', { reviewerId: req.user?.id, status: req.body?.status });
    
    // Validate required fields
    if (!req.params.id) {
      console.log('[review] Error: submission ID missing');
      return res.status(400).json({ error: 'Submission ID is required' });
    }
    if (!req.body.status) {
      console.log('[review] Error: status missing');
      return res.status(400).json({ error: 'Status is required' });
    }
    if (!req.user?.id) {
      console.log('[review] Error: reviewerId missing');
      return res.status(400).json({ error: 'Authenticated reviewer is required' });
    }

    const updated = await submissionsService.reviewSubmission(req.params.id, {
      reviewerId: req.user.id,
      status: req.body.status,
      reviewComment: req.body.reviewComment || ''
    });
    
    console.log('[review] Submission reviewed successfully:', updated?.id);
    res.json(updated);
  } catch (err) {
    console.error('[review] ERROR:', err.message);
    console.error('[review] ERROR stack:', err.stack);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await submissionsService.deleteSubmission(req.params.id);
    res.json({ message: 'Submission deleted successfully', submission });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
