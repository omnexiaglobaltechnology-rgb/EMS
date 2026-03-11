const Task = require('../../models/Task');
const TaskVersion = require('../../models/TaskVersion');

// CREATE TASK
exports.createTask = async (data) => {
  const User = require('../../models/User');

  // Validate required fields
  if (!data.title) throw new Error('Title is required');
  if (!data.description) throw new Error('Description is required');
  if (!data.assignedToId) throw new Error('Assigned To ID is required');
  if (!data.assignedById) throw new Error('Assigned By ID is required');
  if (!data.priority) throw new Error('Priority is required');
  if (!data.dueDate) throw new Error('Due date is required');

  // Try to resolve departmentId — from the request or the assignee's profile (optional)
  let departmentId = data.departmentId || null;
  if (!departmentId) {
    const assignee = await User.findById(data.assignedToId).select('departmentId').lean();
    departmentId = assignee?.departmentId || null;
  }

  const safeData = {
    title: data.title,
    description: data.description,
    assignedToId: data.assignedToId,
    assignedById: data.assignedById,
    priority: data.priority
  };

  // Only set departmentId if we have a valid value
  if (departmentId) {
    safeData.departmentId = departmentId;
  }

  // Validate and parse dueDate
  const d = new Date(data.dueDate);
  if (isNaN(d)) throw new Error('Invalid dueDate');
  safeData.dueDate = d;

  return Task.create(safeData);
};


// GET TASKS
exports.getTasks = async () => {
  try {
    const tasks = await Task.find()
      .populate('assignedToId', 'name email')   // Pull name + email for the assignee
      .populate('assignedById', 'name email')   // Pull name + email for the assigner
      .lean();

    // Map _id to id and flatten populated user objects for the frontend
    return (tasks || []).map((t) => ({
      ...t,
      id: t._id.toString(),
      // Keep the populated user object but also add a flat displayName for easy use
      assignedTo: t.assignedToId
        ? {
          id: t.assignedToId._id.toString(),
          name: t.assignedToId.name || 'Unknown',
          email: t.assignedToId.email || '',
        }
        : null,
      assignedBy: t.assignedById
        ? {
          id: t.assignedById._id.toString(),
          name: t.assignedById.name || 'Unknown',
          email: t.assignedById.email || '',
        }
        : null,
      // Keep raw IDs as strings for filtering (e.g. intern task filter)
      assignedToId: t.assignedToId ? t.assignedToId._id.toString() : null,
      assignedById: t.assignedById ? t.assignedById._id.toString() : null,
      departmentId: t.departmentId ? t.departmentId.toString() : null,
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
};

// GET TASK BY ID
exports.getTaskById = async (id) => {
  const task = await Task.findById(id)
    .populate('assignedToId')
    .populate('assignedById')
    .populate('departmentId')
    .lean();

  if (!task) {
    throw new Error('Task not found');
  }

  return task;
};

// UPDATE TASK WITH VERSION TRACKING
exports.updateTask = async (id, data) => {

  const existingTask = await Task.findById(id);

  if (!existingTask) {
    throw new Error("Task not found");
  }

  // Save old version
  await TaskVersion.create({
    taskId: existingTask._id,
    versionNo: existingTask.versionNo,
    title: existingTask.title,
    description: existingTask.description,
    dueDate: existingTask.dueDate,
    changedById: data.changedById || "system"
  });

  // Prepare safe update object
  const updateData = {
    versionNo: existingTask.versionNo + 1
  };

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.dueDate !== undefined) {
    const d = new Date(data.dueDate);
    if (isNaN(d)) throw new Error('Invalid dueDate');
    updateData.dueDate = d;
  }

  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  return Task.findByIdAndUpdate(id, updateData, { new: true });
};

// GET TASK VERSIONS
exports.getTaskVersions = async (taskId) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  return TaskVersion.find({ taskId })
    .populate('changedById')
    .sort({ createdAt: -1 })
    .lean();
};

// DELETE TASK
exports.deleteTask = async (id) => {
  const task = await Task.findById(id);

  if (!task) {
    throw new Error('Task not found');
  }

  return Task.findByIdAndDelete(id);
};

// ASSIGN TASK (Only Team Lead can assign)
exports.assignTask = async (taskId, assignedToId, assignedById, userRole) => {
  // Only Team Lead (TL) can assign tasks
  if (userRole !== 'team_lead' && userRole !== 'tl' && userRole !== 'admin') {
    throw new Error('Only Team Lead can assign tasks');
  }

  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error('Task not found');
  }

  // Save old version
  await TaskVersion.create({
    taskId: task._id,
    versionNo: task.versionNo,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    changedById: assignedById
  });

  return Task.findByIdAndUpdate(
    taskId,
    {
      assignedToId,
      versionNo: task.versionNo + 1
    },
    { new: true }
  )
    .populate('assignedToId')
    .populate('assignedById');
};

