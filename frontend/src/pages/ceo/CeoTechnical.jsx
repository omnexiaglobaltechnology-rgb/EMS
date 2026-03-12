import { useState } from "react";

import Row from "../../components/ceo/Row";
import ExpandButton from "../../components/ceo/ExpandedButton";
import Avatar from "../../components/ceo/Avatar";
import Info from "../../components/ceo/Info";
import Stats from "../../components/ceo/Stats";
import Actions from "../../components/ceo/Actions";
import Button from "../../components/ceo/Button";

const data = [
  {
    id: 1,
    name: "Dr. Alice Vogel",
    role: "CTO (Technical Head)",
    avatar: "https://i.pravatar.cc/100?img=47",
    managers: 4,
    leads: 15,
    children: [
      {
        id: 2,
        name: "David Lee",
        role: "Team Lead",
        avatar: "https://i.pravatar.cc/100?img=2",
        managers: 3,
        leads: 4,
        interns: [
          {
            id: 3,
            name: "John Smith",
            status: "CLEAN",
            avatar: "https://i.pravatar.cc/100?img=3",
          },
          {
            id: 4,
            name: "Emily Davis",
            status: "GREEN",
            avatar: "https://i.pravatar.cc/100?img=4",
          },
          {
            id: 5,
            name: "Michael Doe",
            status: "PENDING",
            avatar: "https://i.pravatar.cc/100?img=5",
          },
        ],
      },
    ],
  },
];

const statusColors = {
  CLEAN: "bg-green-900/40 text-green-900",
  GREEN: "bg-emerald-900/40 text-emerald-900",
  PENDING: "bg-yellow-900/40 text-yellow-900",
};

/**
 * View bridging the CEO interface to technical engineering team hierarchies.
 * Displays interactive expandable rows containing engineering managers, team leads, and interns.
 */
const CeoTechnical = () => {
  const [openHeads, setOpenHeads] = useState({});
  const [openLeads, setOpenLeads] = useState({});

  /**
   * Toggles the open/closed state of an expandable row item.
   * @param {function} setter - The state setter associated with the specific hierarchical level
   * @param {string|number} id - The ID of the item being toggled
   */
  const toggle = (setter, id) =>
    setter((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl rounded-2xl border border-gray-300 p-6">
        {data.map((head) => (
          <div key={head.id} className="space-y-4">
            {/* Department Head */}
            <Row>
              <ExpandButton
                open={openHeads[head.id]}
                onClick={() => toggle(setOpenHeads, head.id)}
              />
              <Avatar src={head.avatar} />
              <Info name={head.name} role={head.role} />

              <Stats managers={head.managers} leads={head.leads} />

              <Actions />
            </Row>

            {/* Team Leads */}
            {openHeads[head.id] &&
              head.children.map((lead) => (
                <div key={lead.id} className="ml-10 space-y-3">
                  <Row>
                    <ExpandButton
                      open={openLeads[lead.id]}
                      onClick={() => toggle(setOpenLeads, lead.id)}
                    />
                    <Avatar src={lead.avatar} />
                    <Info name={lead.name} role={lead.role} />

                    <Stats managers={lead.managers} leads={lead.leads} />

                    <Actions />
                  </Row>

                  {/* Interns */}
                  {openLeads[lead.id] &&
                    lead.interns.map((intern) => (
                      <div
                        key={intern.id}
                        className="ml-10 rounded-xl border border-gray-300 p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar src={intern.avatar} />
                          <div>
                            <p className="font-medium">{intern.name}</p>
                            <span
                              className={`mt-1 inline-block rounded-full px-3 py-1 text-xs ${statusColors[intern.status]}`}
                            >
                              {intern.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button label="View Profile" />
                          <Button label="View Tasks" />
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CeoTechnical;
