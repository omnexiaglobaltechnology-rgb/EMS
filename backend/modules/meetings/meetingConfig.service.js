const MeetingConfig = require("../../models/MeetingConfig");

const getOrCreateConfig = async () => {
  let config = await MeetingConfig.findOne();
  if (!config) {
    config = await MeetingConfig.create({
      allowedRoles: ["ceo", "cto", "cfo", "coo", "manager", "team_lead"],
      canInviteAcrossDepartments: ["ceo", "cto", "cfo", "coo"]
    });
  }
  return config;
};

const updateConfig = async (data, userId) => {
  let config = await MeetingConfig.findOne();
  if (!config) {
    config = new MeetingConfig(data);
  } else {
    Object.assign(config, data);
  }
  config.updatedBy = userId;
  return await config.save();
};

const checkCreationPermission = async (role) => {
  const config = await getOrCreateConfig();
  return config.allowedRoles.includes(role);
};

const checkInvitePermission = async (role) => {
  const config = await getOrCreateConfig();
  return config.canInviteAcrossDepartments.includes(role);
};

module.exports = {
  getOrCreateConfig,
  updateConfig,
  checkCreationPermission,
  checkInvitePermission
};
