import { useState, useEffect } from "react";
import { chatApi } from "../utils/api";
import { Plus, MessageSquare, Users, Pencil, Hash } from "lucide-react";
import ChatRoomModal from "../components/ChatRoomModal";

const AdminChatManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

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

  const handleUpdateRoom = async (payload) => {
    try {
      await chatApi.updateRoom(editingRoom._id, payload);
      fetchRooms();
    } catch (err) {
      console.error("Failed to update room", err);
      throw err;
    }
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoom(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Chat Management</h1>
          <p className="text-white/60 font-medium">Create and manage organization-wide chat rooms</p>
        </div>
        <button
          onClick={() => { setEditingRoom(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
        >
          <Plus size={18} />
          Create Chat Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-white/30 backdrop-blur-md rounded-3xl border border-white/10 bg-white/5">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400 mx-auto mb-4"></div>
            <p className="font-medium">Loading chat rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl bg-white/2 backdrop-blur-sm">
            <MessageSquare className="mx-auto h-16 w-16 text-white/10 mb-4" />
            <p className="text-white/40 text-lg font-bold">No chat rooms created yet</p>
            <button
              onClick={() => { setEditingRoom(null); setShowModal(true); }}
              className="mt-4 text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors uppercase tracking-widest"
            >
              Create your first room
            </button>
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room._id} className="card-glass p-6 flex flex-col justify-between group hover:border-white/20 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/5 rounded-2xl text-indigo-400 border border-white/10 group-hover:bg-indigo-500/10 transition-colors">
                    {room.type === 'announcement' ? <Hash size={24} /> : <Users size={24} />}
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-lg bg-white/5 text-white/40 border border-white/10">
                    {room.type?.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                  {room.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                  <p className="text-sm text-white/40 font-medium">
                    {room.departmentId?.name || 'Public'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-wider">
                  <Users size={14} className="text-white/20" />
                  <span>{room.participants?.length || 0} Members</span>
                </div>
                <button
                  onClick={() => openEditModal(room)}
                  className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-widest hover:text-white hover:bg-indigo-500/20 px-4 py-2 rounded-xl transition-all"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ChatRoomModal
          onClose={closeModal}
          onSave={editingRoom ? handleUpdateRoom : handleCreateRoom}
          room={editingRoom}
        />
      )}
    </div>
  );
};

export default AdminChatManagement;
