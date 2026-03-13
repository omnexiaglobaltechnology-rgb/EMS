const meetingService = require('./meeting.service');

const create = async (req, res, next) => {
  try {
    const meeting = await meetingService.createMeeting(req.user.id, req.body);
    res.status(201).json(meeting);
  } catch (err) {
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const meetings = await meetingService.getMeetings(req.user);
    res.json(meetings);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const meeting = await meetingService.getMeetingById(req.params.id);
    res.json(meeting);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const meeting = await meetingService.updateMeeting(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json(meeting);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await meetingService.deleteMeeting(
      req.params.id,
      req.user.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const updateInvitees = async (req, res, next) => {
  try {
    const meeting = await meetingService.updateInvitees(
      req.params.id,
      req.body.invitees,
      req.user.id
    );
    res.json(meeting);
  } catch (err) {
    next(err);
  }
};

const searchInvitees = async (req, res, next) => {
  try {
    const users = await meetingService.searchInvitees({
      departmentId: req.query.departmentId,
      role: req.query.role,
      reportsTo: req.query.reportsTo,
      search: req.query.search,
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const getConfig = async (req, res, next) => {
  try {
    const meetingConfigService = require('./meetingConfig.service');
    const config = await meetingConfigService.getOrCreateConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
};

const updateConfig = async (req, res, next) => {
  try {
    const meetingConfigService = require('./meetingConfig.service');
    const config = await meetingConfigService.updateConfig(req.body, req.user.id);
    res.json(config);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  updateInvitees,
  searchInvitees,
  getConfig,
  updateConfig,
};
