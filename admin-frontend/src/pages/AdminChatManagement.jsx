import { useState, useEffect } from "react";
import { chatApi } from "../utils/api";
import { Plus, MessageSquare, Users, Trash2, Hash } from "lucide-react";
import ChatRoomModal from "../components/ChatRoomModal";

const AdminChatManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getRooms();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (payload) => {
    try {
      await chatApi.adminCreateRoom(payload);
      fetchRooms();
    } catch (err) {
      console.error("Failed to create room", err);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chat Management</h1>
          <p className="text-slate-500">Create and manage organization-wide chat rooms</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Create Chat Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p>Loading chat rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium">No chat rooms created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-indigo-600 text-sm font-semibold hover:text-indigo-700"
            >
              Create your first room
            </button>
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    {room.type === 'announcement' ? <Hash size={20} /> : <Users size={20} />}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {room.type?.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {room.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Department: <span className="font-semibold">{room.departmentId?.name || 'N/A'}</span>
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Users size={14} />
                  <span>{room.participants?.length || 0} participants</span>
                </div>
                {/* Future: Add participants view or delete room */}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ChatRoomModal
          onClose={() => setShowModal(false)}
          onSave={handleCreateRoom}
        />
      )}
    </div>
  );
};

export default AdminChatManagement;
