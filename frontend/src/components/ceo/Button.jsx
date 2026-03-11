/**
 * A simple, styled button component for general use within CEO views.
 *
 * @param {string} label - The text displayed inside the button
 */
const Button = ({ label }) => (
  <button className="rounded-lg border cursor-pointer border-gray-300 hover:bg-gray-200 px-4 py-2">
    {label}
  </button>
);

export default Button;
