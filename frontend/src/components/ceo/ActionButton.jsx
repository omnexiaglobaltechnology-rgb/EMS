// eslint-disable-next-line no-unused-vars
/**
 * A reusable button component displaying an icon alongside a text label.
 *
 * @param {React.ElementType} icon - The Lucide React icon component to display
 * @param {string} label - The text label of the button
 */
const ActionButton = ({ icon: Icon, label }) => (
  <button className="flex items-center gap-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200 px-4 py-2">
    <Icon size={16} />
    {label}
  </button>
);

export default ActionButton;
