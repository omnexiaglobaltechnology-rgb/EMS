import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * A toggleable chevron icon button typically used for expand/collapse actions.
 * Displays ChevronDown when open, ChevronRight when closed.
 *
 * @param {boolean} open - The current state of the expansion (true if open)
 * @param {function} onClick - Callback handler when the button is clicked
 */
const ExpandButton = ({ open, onClick }) => (
  <button
    onClick={onClick}
    className="rounded-lg border border-gray-300 hover:bg-gray-300/30 transition text-gray-500 cursor-pointer p-2"
  >
    {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
  </button>
);

export default ExpandButton;
