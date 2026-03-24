const MEETINGS_STORAGE_KEY = "ems_shared_meetings";

const emitNotificationsUpdated = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("ems:notifications:updated"));
};

const safeParseMeetings = (value) => {
    try {
        const parsed = JSON.parse(value || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const toDisplayTime = (timeValue) => {
    if (!timeValue) return "";
    if (timeValue.includes("AM") || timeValue.includes("PM")) return timeValue;

    const [hoursString, minutesString] = timeValue.split(":");
    const hours = Number(hoursString);
    if (Number.isNaN(hours)) return timeValue;

    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${minutesString} ${period}`;
};

const normalizeMeeting = (meeting, creatorRole) => {
    const date = meeting.date || meeting.datetime?.split(" at ")?.[0] || "";
    const time = toDisplayTime(meeting.time || meeting.datetime?.split(" at ")?.[1] || "");

    return {
        id: meeting.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: meeting.title || "Untitled Meeting",
        datetime: meeting.datetime || `${date}${time ? ` at ${time}` : ""}`,
        participants: Array.isArray(meeting.participants) ? meeting.participants : [],
        status: meeting.status || "Scheduled",
        date,
        time,
        duration: meeting.duration || "30 min",
        platform: meeting.platform || "EMS Meet",
        link: meeting.link || "#",
        description: meeting.description || "",
        creatorRole: meeting.creatorRole || creatorRole || "unknown",
        targetRoles: Array.isArray(meeting.targetRoles)
            ? meeting.targetRoles
            : [],
        createdAt: meeting.createdAt || new Date().toISOString(),
    };
};

const isVisibleToRole = (meeting, role) => {
    if (!Array.isArray(meeting.targetRoles) || meeting.targetRoles.length === 0) {
        return true;
    }

    return meeting.targetRoles.includes(role);
};

export const getAllStoredMeetings = () => {
    const stored = localStorage.getItem(MEETINGS_STORAGE_KEY);
    return safeParseMeetings(stored);
};

export const saveStoredMeetings = (meetings) => {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
    emitNotificationsUpdated();
};

export const addMeetingToStore = (meeting, creatorRole) => {
    const currentMeetings = getAllStoredMeetings();
    const meetingToSave = normalizeMeeting(meeting, creatorRole);
    const updatedMeetings = [...currentMeetings, meetingToSave];
    saveStoredMeetings(updatedMeetings);
    return meetingToSave;
};

export const getMeetingsByCreator = (creatorRole) => {
    return getAllStoredMeetings().filter((meeting) => meeting.creatorRole === creatorRole);
};

export const getMeetingsByCreators = (creatorRoles = []) => {
    return getAllStoredMeetings().filter((meeting) => creatorRoles.includes(meeting.creatorRole));
};

export const getMeetingsForRole = (role, creatorRoles = []) => {
    return getAllStoredMeetings().filter((meeting) => {
        const creatorMatch =
            creatorRoles.length === 0 || creatorRoles.includes(meeting.creatorRole);
        return creatorMatch && isVisibleToRole(meeting, role);
    });
};
