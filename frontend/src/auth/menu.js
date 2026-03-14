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
  employee: [
    "dashboard",
    "my-tasks",
    "submissions",
    "meetings",
    "chat",
    "profile",
  ],
  team_lead: [
    "dashboard",
    "tasks",
    "employee-management",
    "reviews",
    "meetings",
    "chat",
    "settings",
  ],
  team_lead_intern: [
    "dashboard",
    "intern-tasks",
    "employee-management",
    "reviews",
    "meetings",
    "chat",
    "settings",
  ],
  manager: [
    "dashboard",
    "analytics",
    "employee-management",
    "reports",
    "meetings",
    "chat",
    "settings",
  ],
  manager_intern: [
    "dashboard",
    "intern-analytics",
    "employee-management",
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
    "employee-management",
    "analytics",
    "meetings",
    "reports",
    "chat",
    "settings",
  ],
  cfo: [
    "dashboard",
    "organization",
    "employee-management",
    "analytics",
    "reports",
    "meetings",
    "chat",
    "settings",
  ],
  cto: [
    "dashboard",
    "organization",
    "employee-management",
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
    "employee-management",
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
