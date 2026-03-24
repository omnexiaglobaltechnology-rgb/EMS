// Action Button Component

const ActionButton = ({ icon: IconComponent, label }) => (
  <button className="flex items-center gap-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-200 px-4 py-2">
    <IconComponent size={16} />
    {label}
  </button>
);

export default ActionButton;
