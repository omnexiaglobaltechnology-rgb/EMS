const Task = require('../../models/Task');
const TaskVersion = require('../../models/TaskVersion');
const User = require('../../models/User');
const { 
  notifyTaskAssignment, 
  notifyTaskDelegation, 
  notifyTaskSubmission, 
  notifyTaskReview 
} = require('../../utils/taskNotification.service');

const ROLE_LEVELS = {
  'intern': 1,
  'employee': 2,
  'team_lead_intern': 3,
  'team_lead': 4,
  'manager_intern': 5,
  'manager:': 6,
  'admin': 7,
  'cto': 8,
  'cfo': 8,
  'coo': 8,
  'ceo': 9
};

const getRoleLevel = (role) => ROLE_LEVELS[role] || 0;

const canAssignTo = (assignerRole, targetRole) => {
  return getRoleLevel(assignerRole) > getRoleLevel(targetRole);
};

exports.createTask = async (data) => {
  if (!data.title) throw new Error('Title is required');
  if (!data.assignedToId) throw new Error('Assigned To ID is required');
  if (!data.assignedById) throw new Error('Assigned By ID is required');

  const assigner = await User.findById(data.assignedById);
  const assignee = await User.findById(data.assignedToId);

  if (!assigner || !assignee) throw new Error('User not found');

  if (!canAssignTo(assigner.role, assignee.role)) {
    throw new Error(`You cannot assign tasks to someone with a ${assignee.role} role.`);
  }

  const taskData = {
    title: data.title,
    description: data.description || '',
    assignedToId: data.assignedToId,
    assignedById: data.assignedById,
    currentResponsibleId: data.assignedToId,
    priority: data.priority || 'medium',
    dueDate: new Date(data.dueDate),
    departmentId: data.departmentId || assignee.departmentId,
    status: 'assigned',
    history: [{
      status: 'assigned',
      changedById: data.assignedById,
      note: 'Task created and assigned'
    }]
  };

  if (isNaN(taskData.dueDate)) throw new Error('Invalid dueDate');

  const task = await Task.create(taskData);
  
  // Notify
  notifyTaskAssignment(assignee, task, assigner).catch(console.error);

  return task;
};

exports.getTasks = async (query = {}) => {
  return await Task.find(query)
    .populate('assignedToId', 'name email role')
    .populate('assignedById', 'name email role')
    .populate('currentResponsibleId', 'name email role')
    .sort({ createdAt: -1 });
};

exports.updateTask = async (id, data, userId, userRole) => {
  const task = await Task.findById(id);
  if (!task) throw new Error('Task not found');

  if (data.dueDate) {
    const creator = await User.findById(task.assignedById);
    const isCreator = task.assignedById.toString() === userId.toString();
    const isSenior = getRoleLevel(userRole) > getRoleLevel(creator?.role || '');
    if (!isCreator && !isSenior) {
      throw new Error('Only the task creator or a senior role can modify the deadline.');
    }
    task.dueDate = new Date(data.dueDate);
  }

  if (data.title) task.title = data.title;
  if (data.description) task.description = data.description;
  if (data.priority) task.priority = data.priority;
  if (data.status) task.status = data.status;

  task.history.push({
    status: task.status,
    changedById: userId,
    note: data.note || 'Task updated'
  });

  return await task.save();
};

exports.delegateTask = async (taskId, delegateToId, userId, userRole) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');

  if (task.currentResponsibleId.toString() !== userId.toString() && getRoleLevel(userRole) < getRoleLevel('admin')) {
    throw new Error('You are not currently responsible for this task.');
  }

  const delegatee = await User.findById(delegateToId);
  if (!delegatee) throw new Error('Delegatee not found');

  if (!canAssignTo(userRole, delegatee.role)) {
    throw new Error('Cannot delegate to a senior or equal role.');
  }

  task.currentResponsibleId = delegateToId;
  task.status = 'delegated';
  task.history.push({
    status: 'delegated',
    changedById: userId,
    note: `Delegated to ${delegatee.name}`
  });

  const savedTask = await task.save();

  // Notify
  const delegator = await User.findById(userId);
  notifyTaskDelegation(delegatee, savedTask, delegator).catch(console.error);

  return savedTask;
};

exports.submitTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');

  if (task.currentResponsibleId.toString() !== userId.toString()) {
    throw new Error('You are not currently responsible for this task.');
  }

  task.status = 'submitted';
  task.history.push({
    status: 'submitted',
    changedById: userId,
    note: 'Task submitted for review'
  });

  const savedTask = await task.save();

  // Notify creator
  const creator = await User.findById(task.assignedById);
  const submitter = await User.findById(userId);
  notifyTaskSubmission(creator, savedTask, submitter).catch(console.error);

  return savedTask;
};

exports.reviewTask = async (taskId, status, comment, userId, userRole) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error('Task not found');

  const creator = await User.findById(task.assignedById);
  const isCreator = task.assignedById.toString() === userId.toString();
  const isSenior = getRoleLevel(userRole) > getRoleLevel(creator?.role || '');

  if (!isCreator && !isSenior) {
    throw new Error('You do not have permission to review this task.');
  }

  if (!['completed', 'rejected', 'under_review', 'approved'].includes(status)) {
    throw new Error('Invalid review status');
  }

  task.status = status;
  task.history.push({
    status,
    changedById: userId,
    note: comment || `Task reviewed: ${status}`
  });

  const savedTask = await task.save();

  // Notify responsible person
  const responsible = await User.findById(task.currentResponsibleId);
  const reviewer = await User.findById(userId);
  notifyTaskReview(responsible, savedTask, reviewer, status).catch(console.error);

  return savedTask;
};

exports.deleteTask = async (id) => {
  return await Task.findByIdAndDelete(id);
};

exports.getTaskVersions = async (taskId) => {
  const task = await Task.findById(taskId).populate('history.changedById', 'name role');
  return task ? task.history : [];
};
