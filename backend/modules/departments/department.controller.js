const departmentService = require('./department.service');

const create = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(
      req.body,
      req.user.id
    );
    res.status(201).json(department);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const departments = await departmentService.getDepartments({
      type: req.query.type,
    });
    res.json(departments);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    res.json(department);
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await departmentService.getDepartmentUsers(req.params.id);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const department = await departmentService.updateDepartment(
      req.params.id,
      req.body
    );
    res.json(department);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await departmentService.deleteDepartment(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getAll, getById, getUsers, update, remove };
