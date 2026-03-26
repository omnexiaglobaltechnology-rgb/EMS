/**
 * Component that displays high-level statistics, specifically manager and team lead counts.
 *
 * @param {number|string} managers - Total count of managers
 * @param {number|string} leads - Total count of team leads
 */
const Stats = ({ managers, leads }) => (
  <div className="flex gap-10 text-sm">
    <div>
      Managers
      <p className="">{managers}</p>
    </div>
    <div>
      Team Leads
      <p className="">{leads}</p>
    </div>
  </div>
);

export default Stats;
