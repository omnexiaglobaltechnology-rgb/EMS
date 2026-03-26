const taskService = require('./task.service');

exports.createTask = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      assignedById: req.user?.id || req.body.assignedById,
    };
    const task = await taskService.createTask(payload);
    res.status(201).json(task);
  } catch (error) {
    console.error('CREATE TASK ERROR:', error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    console.log('[getTasks] Starting to fetch tasks...');
    const tasks = await taskService.getTasks();
    console.log('[getTasks] Successfully fetched tasks:', tasks?.length || 0, 'tasks');
    res.json(tasks);
  } catch (error) {
    console.error('GET TASKS ERROR:', error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.json(task);
  } catch (error) {
    console.error('GET TASK ERROR:', error.message);
    res.status(404).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role
    );
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await taskService.deleteTask(req.params.id);
    res.json({ message: 'Task deleted successfully', task });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.getTaskVersions = async (req, res) => {
  try {
    const versions = await taskService.getTaskVersions(req.params.id);
    res.json(versions);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const { assignedToId } = req.body;
    const task = await taskService.createTask({
      ...req.body,
      assignedById: req.user.id,
      assignedToId
    });
    res.json(task);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

exports.delegateTask = async (req, res) => {
  try {
    const { delegateToId } = req.body;
    const task = await taskService.delegateTask(
      req.params.id,
      delegateToId,
      req.user.id,
      req.user.role
    );
    res.json(task);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};

exports.submitTask = async (req, res) => {
  try {
    const task = await taskService.submitTask(req.params.id, req.user.id);
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.reviewTask = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const task = await taskService.reviewTask(
      req.params.id,
      status,
      comment,
      req.user.id,
      req.user.role
    );
    res.json(task);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};
