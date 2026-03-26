/**
 * Displays a circular avatar image.
 *
 * @param {string} src - The URL or path to the avatar image
 */
const Avatar = ({ src }) => (
  <img src={src} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
);

export default Avatar;
