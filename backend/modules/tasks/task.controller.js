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
  console.log('REQ PARAM ID:', req.params.id);
  try {
    const payload = {
      ...req.body,
      changedById: req.user?.id || req.body.changedById,
    };
    const task = await taskService.updateTask(req.params.id, payload);
    res.json(task);
  } catch (error) {
    console.error('UPDATE ERROR:', error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await taskService.deleteTask(req.params.id);
    res.json({ message: 'Task deleted successfully', task });
  } catch (error) {
    console.error('DELETE TASK ERROR:', error.message);
    res.status(404).json({ error: error.message });
  }
};

exports.getTaskVersions = async (req, res) => {
  try {
    const versions = await taskService.getTaskVersions(req.params.id);
    res.json(versions);
  } catch (error) {
    console.error('GET VERSIONS ERROR:', error.message);
    res.status(404).json({ error: error.message });
  }
};

exports.assignTask = async (req, res) => {
  try {
    const { assignedToId } = req.body;
    const taskId = req.params.id;
    const assignedById = req.user?.id || req.body.assignedById;
    const userRole = req.user?.role || req.body.role;

    if (!assignedToId) {
      return res.status(400).json({ error: 'assignedToId is required' });
    }

    const task = await taskService.assignTask(
      taskId,
      assignedToId,
      assignedById,
      userRole
    );
    res.json(task);
  } catch (error) {
    console.error('ASSIGN TASK ERROR:', error.message);
    res.status(403).json({ error: error.message });
  }
};
