/**
 * Displays an intern user's avatar.
 * Falls back to displaying initials if no avatar image is provided.
 *
 * @param {object} user - The user object containing name and optional avatar URL
 */
const Avatar = ({ user }) => {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return user.avatar ? (
    <img
      src={user.avatar}
      alt={user.name}
      className="h-10 w-10 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
      {initials}
    </div>
  );
};

export default Avatar;
