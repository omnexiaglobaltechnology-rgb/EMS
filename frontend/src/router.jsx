import { createBrowserRouter, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import { ROLES } from "./auth/roles";

/* Intern Pages */
import InternDashboard from "./pages/intern/InternDashboard";
import InternMyTasks from "./pages/intern/InternMyTasks";
import InternSubmissions from "./pages/intern/InternSubmissions";
import InternMeetings from "./pages/intern/InternMeetings";
import InternDepartmentChat from "./pages/intern/InternDepartmentChat";
import InternProfile from "./pages/intern/InternProfile";
import InternMeetingRoom from "./pages/intern/InternMeetingRoom";

/* Team Lead Pages */
import TlDashboard from "./pages/tl-panel/TlDashboard";
import TlInternTask from "./pages/tl-panel/TlTask";
import TlSubmissionsReview from "./pages/tl-panel/TlSubmissionsReview";
import TlMeetings from "./pages/tl-panel/TlMeetings";
import TlDepartmentChat from "./pages/tl-panel/TlDepartmentChat";
import TlMeetingRoom from "./pages/tl-panel/TlMeetingRoom";

/*Team Lead Intern Pages */
import TlDashboardIntern from "./pages/tl-intern/TlDashboardIntern";
import TlDepartmentIntern from "./pages/tl-intern/TlDepartmentIntern";
import TlSubmissionsReviewIntern from "./pages/tl-intern/TlSubmissionsReviewIntern";
import TlInternTaskIntern from "./pages/tl-intern/TlInternTaskIntern";
import TlMeetingsIntern from "./pages/tl-intern/TlMeetingsIntern";

/* Manager Pages */
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerAnalytics from "./pages/manager/ManagerAnalytics";
import ManagerReports from "./pages/manager/ManagerReports";
import ManagerMeetings from "./pages/manager/ManagerMeetings";
import ManagerDepartmentChat from "./pages/manager/ManagerDepartmentChat";
import MeetingRoom from "./pages/manager/MeetingRoom";

/* Manager Intern Pages */
import Manager_internDashboard from "./pages/manager_intern/Manager_internDashboard";
import Manager_internAnalytics from "./pages/manager_intern/Manager_internAnalytics";
import Manager_internMeetings from "./pages/manager_intern/Manager_internMeetings";
import Manager_internDepartmentChat from "./pages/manager_intern/Manager_internDepartmentChat";
import Manager_internReports from "./pages/manager_intern/Manager_internReports";
import Manager_internSubmissionsReview from "./pages/manager_intern/Manager_internSubmissionsReview";
import ProfileSettings from "./pages/ProfileSettings";



/* CTO Pages */
import CtoDashboard from "./pages/cto/CtoDashboard";
import CtoOrganization from "./pages/cto/CtoOrganization";
import CtoAnalytics from "./pages/cto/CtoAnalytics";
import CtoReports from "./pages/cto/CtoReports";
import CtoDepartmentChat from "./pages/cto/CtoDepartmentChat";
import CtoMeetings from "./pages/cto/CtoMeetings";
import CtoSettings from "./pages/cto/CtoSettings";
import CtoMeetingRoom from "./pages/cto/CtoMeetingRoom";

/* CFO Pages */
import CfoDashboard from "./pages/cfo/CfoDashboard";
import CfoOrganization from "./pages/cfo/CfoOrganization";
import CfoAnalytics from "./pages/cfo/CfoAnalytics";
import CfoReports from "./pages/cfo/CfoReports";
import CfoDepartmentChat from "./pages/cfo/CfoDepartmentChat";
import CfoMeetings from "./pages/cfo/CfoMeetings";
import CfoSettings from "./pages/cfo/CfoSettings";
import CfoMeetingRoom from "./pages/cfo/CfoMeetingRoom";

/* COO Pages */
import CooDashboard from "./pages/coo/CooDashboard";
import CooOrganization from "./pages/coo/CooOrganization";
import CooAnalytics from "./pages/coo/CooAnalytics";
import CooMeetings from "./pages/coo/CooMeetings";
import CooReports from "./pages/coo/CooReports";
import CooDepartmentChat from "./pages/coo/CooDepartmentChat";
import CooSettings from "./pages/coo/CooSettings";
import CooMeetingRoom from "./pages/coo/CooMeetingRoom";

/* CEO Pages */
import CeoDashboard from "./pages/ceo/CeoDashboard";
import CeoTechnical from "./pages/ceo/CeoTechnical";
import CeoOperations from "./pages/ceo/CeoOperations";
import CeoFinance from "./pages/ceo/CeoFinance";
import CeoMeetings from "./pages/ceo/CeoMeetings";
import CeoAnalytics from "./pages/ceo/CeoAnalytics";
import CeoReports from "./pages/ceo/CeoReports";
import CeoAnnouncements from "./pages/ceo/CeoAnnouncements";
import CeoOrganizationChat from "./pages/ceo/CeoOrganizationChat";
import CeoSettings from "./pages/ceo/CeoSettings";
import CeoMeetingRooms from "./pages/ceo/CeoMeetingRooms";

export const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/unauthorized", element: <Unauthorized /> },

  /* ================= INTERN ================= */
  {
    path: "/intern",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.INTERN]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <InternDashboard /> },
      { path: "my-tasks", element: <InternMyTasks /> },
      { path: "submissions", element: <InternSubmissions /> },
      { path: "meetings", element: <InternMeetings /> },
      { path: "chat", element: <InternDepartmentChat /> },
      { path: "profile", element: <InternProfile /> },
      { path: "settings", element: <ProfileSettings /> },
      { path: "intern-meeting-room/:id", element: <InternMeetingRoom /> },
    ],
  },

  /* ================= TEAM LEAD ================= */
  {
    path: "/team_lead",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.TL]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <TlDashboard /> },
      { path: "tasks", element: <TlInternTask /> },
      { path: "reviews", element: <TlSubmissionsReview /> },
      { path: "meetings", element: <TlMeetings /> },
      { path: "chat", element: <TlDepartmentChat /> },
      { path: "settings", element: <ProfileSettings /> },
      { path: "tl-meeting-room/:id", element: <TlMeetingRoom /> },
    ],
  },

  /* ================= TEAM LEAD INTERN ================= */
  {
    path: "/team_lead_intern",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.TLINTERN]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <TlDashboardIntern /> },
      { path: "intern-tasks", element: <TlInternTaskIntern /> },
      { path: "reviews", element: <TlSubmissionsReviewIntern /> },
      { path: "meetings", element: <TlMeetingsIntern /> },
      { path: "chat", element: <TlDepartmentIntern /> },
      { path: "settings", element: <ProfileSettings /> },
      { path: "tl-meeting-room/:id", element: <TlMeetingRoom /> },
    ],
  },

  /* ================= MANAGER ================= */
  {
    path: "/manager",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <ManagerDashboard /> },
      { path: "analytics", element: <ManagerAnalytics /> },
      { path: "reports", element: <ManagerReports /> },
      { path: "meetings", element: <ManagerMeetings /> },
      { path: "chat", element: <ManagerDepartmentChat /> },
      { path: "settings", element: <ProfileSettings /> },
      // { path: "review-submissions", element: <InternSubmissionsReview /> },
      { path: "meeting-room/:id", element: <MeetingRoom /> },
      // { path: "meeting-room/:id", element: <MeetingRoom /> }
    ],
  },

  {
    path: "/manager_intern",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.MANAGER_INTERN]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <Manager_internDashboard /> },

      { path: "intern-analytics", element: <Manager_internAnalytics /> },
      { path: "intern-meetings", element: <Manager_internMeetings /> },
      { path: "chat", element: <Manager_internDepartmentChat /> },
      { path: "reports", element: <Manager_internReports /> },
      {
        path: "review-submissions",
        element: <Manager_internSubmissionsReview />,
      },
      { path: "settings", element: <ProfileSettings /> },
      { path: "meeting-room/:id", element: <InternMeetingRoom /> },
    ],
  },



  /* ================= CTO ================= */
  {
    path: "/cto",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.CTO]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <CtoDashboard /> },
      { path: "organization", element: <CtoOrganization /> },
      { path: "analytics", element: <CtoAnalytics /> },
      { path: "reports", element: <CtoReports /> },
      { path: "meetings", element: <CtoMeetings /> },
      { path: "chat", element: <CtoDepartmentChat /> },
      { path: "settings", element: <CtoSettings /> },
      { path: "cto-meeting-room/:id", element: <CtoMeetingRoom /> },
    ],
  },

  /* ================= CFO ================= */
  {
    path: "/cfo",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.CFO]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <CfoDashboard /> },
      { path: "organization", element: <CfoOrganization /> },
      { path: "analytics", element: <CfoAnalytics /> },
      { path: "reports", element: <CfoReports /> },
      { path: "meetings", element: <CfoMeetings /> },
      { path: "chat", element: <CfoDepartmentChat /> },
      { path: "settings", element: <CfoSettings /> },
      { path: "cfo-meeting-room/:id", element: <CfoMeetingRoom /> },
    ],
  },

  /* ================= COO ================= */
  {
    path: "/coo",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.COO]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <CooDashboard /> },
      { path: "organization", element: <CooOrganization /> },
      { path: "analytics", element: <CooAnalytics /> },
      { path: "meetings", element: <CooMeetings /> },
      { path: "reports", element: <CooReports /> },
      { path: "chat", element: <CooDepartmentChat /> },
      { path: "settings", element: <CooSettings /> },
      { path: "coo-meeting-room/:id", element: <CooMeetingRoom /> },
    ],
  },

  /* ================= CEO ================= */
  {
    path: "/ceo",
    element: (
      <ProtectedRoute allowedRoles={[ROLES.CEO]}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" /> },
      { path: "dashboard", element: <CeoDashboard /> },
      { path: "technical", element: <CeoTechnical /> },
      { path: "operations", element: <CeoOperations /> },
      { path: "finance", element: <CeoFinance /> },
      { path: "meetings", element: <CeoMeetings /> },
      { path: "analytics", element: <CeoAnalytics /> },
      { path: "reports", element: <CeoReports /> },
      { path: "announcements", element: <CeoAnnouncements /> },
      { path: "chat", element: <CeoOrganizationChat /> },
      { path: "settings", element: <CeoSettings /> },
      { path: "ceo-meeting-rooms/:id", element: <CeoMeetingRooms /> },
    ],
  },
]);
