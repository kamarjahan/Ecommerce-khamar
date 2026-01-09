"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Trash2, Shield, Plus, UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";

export default function AdminTeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("editor"); // 'admin', 'editor', 'viewer'

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const snap = await getDocs(collection(db, "admin_users"));
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "admin_users"), {
        email: newEmail,
        role: newRole,
        createdAt: serverTimestamp()
      });
      toast.success("Team member added");
      setShowModal(false);
      setNewEmail("");
      fetchTeam();
    } catch (e) {
      toast.error("Failed to add member");
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this user from the team?")) return;
    try {
      await deleteDoc(doc(db, "admin_users", id));
      setMembers(members.filter(m => m.id !== id));
      toast.success("Member removed");
    } catch (e) {
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team & Roles</h1>
          <p className="text-gray-500">Manage who has access to your store backend.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-800 transition"
        >
          <UserPlus className="h-4 w-4" /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">User</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Role</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.length === 0 ? (
               <tr><td colSpan={3} className="p-8 text-center text-gray-500">No additional team members found.</td></tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-full text-blue-600"><Mail className="h-4 w-4"/></div>
                      <span className="font-medium text-gray-900">{m.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase 
                      ${m.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleRemove(m.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md m-4">
            <h3 className="text-xl font-bold mb-4">Add Team Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={newEmail} 
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full border p-2 rounded" 
                  placeholder="colleague@example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select 
                  value={newRole} 
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="admin">Super Admin (Full Access)</option>
                  <option value="editor">Manager (No Settings Access)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}