const meetingConfigService = require("./meetingConfig.service");

const getConfig = async (req, res) => {
  try {
    const config = await meetingConfigService.getOrCreateConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateConfig = async (req, res) => {
  try {
    const config = await meetingConfigService.updateConfig(req.body, req.user._id);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getConfig,
  updateConfig
};
