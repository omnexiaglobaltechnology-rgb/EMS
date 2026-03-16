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
          className="flex items-center gap-3 rounded-xl emerald-button px-8 py-3.5 text-xs font-black uppercase tracking-[0.2em] active:scale-95 shadow-2xl"
        >
          <Plus size={18} strokeWidth={3} />
          Generate Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 text-center glass rounded-[3rem] border border-white/30 bg-white/30">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ff9f] emerald-glow mx-auto mb-6"></div>
            <p className="font-black uppercase tracking-[0.3em] text-[10px] text-white/40">Synchronizing Data Streams...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/30 rounded-[3rem] bg-white/30 backdrop-blur-md">
            <MessageSquare className="mx-auto h-20 w-20 text-white/5 mb-6" />
            <p className="text-white/20 text-lg font-black uppercase tracking-[0.2em]">Silence Detected</p>
            <button
              onClick={() => { setEditingRoom(null); setShowModal(true); }}
              className="mt-6 text-[#00ff9f] text-[10px] font-black uppercase tracking-[0.3em] hover:emerald-glow transition-all"
            >
              Initialize First Link
            </button>
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room._id} className="card-glass p-6 flex flex-col justify-between group hover:border-white/30 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-white/30 rounded-2xl text-[#00ff9f] border border-white/30 group-hover:bg-emerald-500/30 transition-all duration-500 emerald-glow">
                    {room.type === 'announcement' ? <Hash size={24} strokeWidth={2.5} /> : <Users size={24} strokeWidth={2.5} />}
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-xl bg-white/30 text-white/40 border border-white/30">
                    {room.type?.replace("_", " ")}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white group-hover:text-[#00ff9f] transition-all duration-500 truncate tracking-tighter">
                  {room.name}
                </h3>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 rounded-full bg-[#00ff9f] shadow-[0_0_10px_rgba(0,255,159,1)] animate-pulse"></div>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                    {room.departmentId?.name || 'Public Infrastructure'}
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/30 text-[10px] font-black uppercase tracking-widest">
                  <Users size={14} className="text-white/20" strokeWidth={3} />
                  <span>{room.participants?.length || 0} Entities</span>
                </div>
                <button
                  onClick={() => openEditModal(room)}
                  className="flex items-center gap-2 text-[#00ff9f] text-[10px] font-black uppercase tracking-[0.3em] hover:text-white hover:bg-emerald-500/30 px-5 py-2.5 rounded-xl transition-all border border-transparent hover:border-emerald-500/30 emerald-glow"
                >
                  <Pencil size={12} strokeWidth={3} />
                  Modify
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
