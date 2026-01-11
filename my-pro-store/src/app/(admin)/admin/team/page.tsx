"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { Trash2, Shield, Plus, UserPlus, Mail, Check, X, Pencil, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const runtime = "edge";

// --- PERMISSIONS CONFIG ---
const ALL_PERMISSIONS = [
  { id: "view_dashboard", label: "View Dashboard" },
  { id: "manage_products", label: "Manage Products" },
  { id: "manage_orders", label: "Manage Orders" },
  { id: "manage_customers", label: "Manage Customers" },
  { id: "manage_coupons", label: "Manage Coupons" },
  { id: "manage_support", label: "Support Tickets" },
  { id: "manage_team", label: "Manage Team" },
  { id: "manage_settings", label: "Store Settings" },
];

const PRESETS: Record<string, string[]> = {
  admin: ALL_PERMISSIONS.map(p => p.id), // All access
  editor: ["view_dashboard", "manage_products", "manage_orders", "manage_customers", "manage_coupons", "manage_support"], // No Settings/Team
  viewer: ["view_dashboard"], // Only Dashboard
};

export default function AdminTeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor"); // admin, editor, viewer, custom
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(PRESETS["editor"]);

  useEffect(() => {
    fetchTeam();
  }, []);

  // 1. Fetch
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

  // 2. Handle Role Change (Auto-fill checkboxes)
  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
    if (newRole !== "custom") {
      setSelectedPermissions(PRESETS[newRole] || []);
    }
  };

  // 3. Handle Checkbox Toggle
  const togglePermission = (permId: string) => {
    // If switching to custom manually
    if (role !== "custom") setRole("custom");

    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  // 4. Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPermissions.length === 0) {
      toast.error("Please select at least one permission.");
      return;
    }

    try {
      const userData = {
        email,
        role,
        permissions: selectedPermissions,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        // Update
        await updateDoc(doc(db, "admin_users", editingId), userData);
        toast.success("Permissions updated");
      } else {
        // Create
        await addDoc(collection(db, "admin_users"), {
          ...userData,
          createdAt: serverTimestamp()
        });
        toast.success("Team member invited");
      }

      closeModal();
      fetchTeam();
    } catch (e) {
      toast.error("Operation failed");
    }
  };

  // 5. Delete
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

  // Helpers
  const openEdit = (member: any) => {
    setEditingId(member.id);
    setEmail(member.email);
    setRole(member.role);
    setSelectedPermissions(member.permissions || []);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setEmail("");
    setRole("editor");
    setSelectedPermissions(PRESETS["editor"]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team & Permissions</h1>
          <p className="text-gray-500">Manage access levels and roles for your staff.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition shadow-lg"
        >
          <UserPlus className="h-5 w-5" /> Add Member
        </button>
      </div>

      {/* MEMBERS LIST */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">User</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Access Level</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Permissions</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.length === 0 ? (
               <tr><td colSpan={4} className="p-10 text-center text-gray-500">No team members found.</td></tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-full text-blue-600 border border-blue-100"><Mail className="h-4 w-4"/></div>
                      <div>
                        <span className="font-bold text-gray-900 block">{m.email}</span>
                        <span className="text-xs text-gray-400">Added {m.createdAt?.toDate().toLocaleDateString() || "Recently"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border tracking-wide
                      ${m.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                        m.role === 'custom' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {m.role === 'custom' ? 'Custom' : m.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     {m.role === 'admin' ? (
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Shield className="h-3 w-3"/> Full Access</span>
                     ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                           {m.permissions?.length > 0 ? (
                             <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 border">
                               {m.permissions.length} capabilities active
                             </span>
                           ) : (
                             <span className="text-xs text-red-500">No access</span>
                           )}
                        </div>
                     )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(m)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleRemove(m.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b flex justify-between items-center">
               <h3 className="text-xl font-bold">{editingId ? "Edit Permissions" : "Add Team Member"}</h3>
               <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5"/></button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6">
               <form id="team-form" onSubmit={handleSave} className="space-y-6">
                  
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      disabled={!!editingId} // Cannot change email on edit
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500" 
                      placeholder="colleague@example.com" 
                    />
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Role Preset</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['admin', 'editor', 'viewer', 'custom'].map((r) => (
                         <button
                           key={r}
                           type="button"
                           onClick={() => handleRoleChange(r)}
                           className={`p-3 rounded-xl border text-sm font-medium capitalize transition-all text-left flex items-center justify-between
                             ${role === r 
                               ? 'border-black bg-gray-900 text-white ring-2 ring-black ring-offset-1' 
                               : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                             }`}
                         >
                           {r}
                           {role === r && <Check className="h-4 w-4" />}
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Permissions Checkboxes */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                     <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Capabilities</label>
                        {role === 'admin' && <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Lock className="h-3 w-3"/> All Unlocked</span>}
                     </div>
                     
                     <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {ALL_PERMISSIONS.map((perm) => (
                           <label key={perm.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${selectedPermissions.includes(perm.id) ? 'bg-white shadow-sm border border-gray-200' : 'hover:bg-gray-100'}`}>
                              <input 
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                disabled={role === 'admin'} // Admin always has all
                                className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                              />
                              <span className={`text-sm ${selectedPermissions.includes(perm.id) ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                                 {perm.label}
                              </span>
                           </label>
                        ))}
                     </div>
                     {role === 'custom' && (
                        <p className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                           <AlertCircle className="h-3 w-3" /> Custom mode active. Tick boxes manually.
                        </p>
                     )}
                  </div>
               </form>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
               <button onClick={closeModal} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition">Cancel</button>
               <button form="team-form" type="submit" className="flex-1 bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition">
                 {editingId ? "Save Changes" : "Send Invite"}
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}