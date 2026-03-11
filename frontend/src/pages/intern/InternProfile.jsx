import { Mail } from "lucide-react";
import { useSelector } from "react-redux";

import Section from "../../components/intern/Section";
import InfoRow from "../../components/intern/InfoRow";

/**
 * Personal profile view for interns.
 * Displays internship-specific details, contact info, and skill badges.
 */
const InternProfile = () => {
  // Get user info from Redux auth
  const { name, email } = useSelector((state) => state.auth || {});

  const profile = {
    name: name || "Sophia Kim",
    role: "Frontend Intern",
    email: email || "sophia.kim@company.com",
    department: "Engineering",
    joiningDate: "Jan 15, 2026",
    mentor: "John Williams",
    skills: ["React", "Tailwind CSS", "JavaScript", "UI Design"],
  };

  // Generate initials from name
  const initials = (profile.name || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
        <p className="mt-1 text-slate-500">
          View your personal and role information
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-3xl font-semibold text-indigo-600">
              {initials}
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {profile.name}
            </h2>

            <p className="text-sm text-slate-500">{profile.role}</p>

            <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
              <Mail size={14} />
              {profile.email}
            </p>
          </div>
        </div>

        {/* Right Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
          {/* Personal Info */}
          <Section title="Personal Information">
            <InfoRow label="Full Name" value={profile.name} />
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Department" value={profile.department} />
          </Section>

          {/* Role Info */}
          <Section title="Internship Details">
            <InfoRow label="Role" value={profile.role} />
            <InfoRow label="Joining Date" value={profile.joiningDate} />
            <InfoRow label="Mentor" value={profile.mentor} />
          </Section>

          {/* Skills */}
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default InternProfile;
