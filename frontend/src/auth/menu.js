/**
 * Central navigation schema defining sidebar visibility per user role.
 * Maps role keys to their authorized route identifiers.
 *
 * @constant {Object}
 */
const MENU = {
  intern: [
    "dashboard",
    "my-tasks",
    "submissions",
    "meetings",
    "chat",
    "profile",
  ],
  team_lead: ["dashboard", "tasks", "reviews", "meetings", "chat", "settings"],
  team_lead_intern: [
    "dashboard",
    "intern-tasks",
    "reviews",
    "meetings",
    "chat",
    "settings",
  ],
  manager: ["dashboard", "analytics", "reports", "meetings", "chat", "settings"],
  manager_intern: [
    "dashboard",
    "intern-analytics",
    "reports",
    "intern-meetings",
    "chat",
    "review-submissions",
    "settings",
  ],
  // COO Panel Added Below
  coo: [
    "dashboard",
    "organization",
    "analytics",
    "meetings",
    "reports",
    "chat",
    "settings",
  ],
  cfo: [
    "dashboard",
    "organization",
    "analytics",
    "reports",
    "meetings",
    "chat",
    "settings",
  ],
  cto: [
    "dashboard",
    "organization",
    "analytics",
    "reports",
    "meetings",
    "chat",
    "settings",
  ],
  ceo: [
    "dashboard",
    "technical",
    "operations",
    "finance",
    "meetings",
    "analytics",
    "reports",
    "announcements",
    "chat",
    "settings",
  ],
};

export { MENU };
export default MENU;
