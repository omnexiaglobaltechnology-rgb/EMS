/**
 * Displays brief user information, specifically a name and role.
 *
 * @param {string} name - The user's name
 * @param {string} role - The user's job role or title
 */
const Info = ({ name, role }) => (
  <div>
    <p className="font-semibold">{name}</p>
    <p className="text-sm">{role}</p>
  </div>
);

export default Info;
