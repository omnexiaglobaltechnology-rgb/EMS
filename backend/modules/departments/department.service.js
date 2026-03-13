const Department = require('../../models/Department');
const User = require('../../models/User');

/**
 * Create a new department.
 */
const createDepartment = async (data, creatorId) => {
  const { name, type, description } = data;

  if (!name || !type) {
    throw new Error('Department name and type are required');
  }
  if (!['employee', 'intern'].includes(type)) {
    throw new Error('Department type must be "employee" or "intern"');
  }

  const existing = await Department.findOne({ name, type });
  if (existing) {
    throw new Error(`A ${type} department named "${name}" already exists`);
  }

  const department = await Department.create({
    name,
    type,
    description: description || '',
    createdBy: creatorId,
  });

  return department;
};

/**
 * Get all departments, optionally filtered by type.
 */
const getDepartments = async (filters = {}) => {
  const query = {};
  if (filters.type) query.type = filters.type;

  const departments = await Department.find(query)
    .populate('createdBy', 'name email')
    .sort({ name: 1 });

  return departments;
};

/**
 * Get a single department by ID with its users.
 */
const getDepartmentById = async (id) => {
  const department = await Department.findById(id).populate(
    'createdBy',
    'name email'
  );
  if (!department) throw new Error('Department not found');
  return department;
};

/**
 * Get all users in a department, organized by hierarchy.
 */
const getDepartmentUsers = async (departmentId) => {
  const users = await User.find({ departmentId })
    .select('name email username role userType reportsTo')
    .populate('reportsTo', 'name email username role')
    .sort({ role: 1, name: 1 });

  return users;
};

/**
 * Update a department.
 */
const updateDepartment = async (id, data) => {
  const department = await Department.findById(id);
  if (!department) throw new Error('Department not found');

  if (data.name) department.name = data.name;
  if (data.description !== undefined) department.description = data.description;

  await department.save();
  return department;
};

/**
 * Delete a department. Unsets departmentId on all users in it.
 */
const deleteDepartment = async (id) => {
  const department = await Department.findById(id);
  if (!department) throw new Error('Department not found');

  // Unset departmentId for all users in this department
  await User.updateMany({ departmentId: id }, { $unset: { departmentId: 1 } });

  await Department.findByIdAndDelete(id);
  return { message: 'Department deleted successfully' };
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  getDepartmentUsers,
  updateDepartment,
  deleteDepartment,
};
