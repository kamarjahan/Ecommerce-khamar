"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { Search, Trash2, Shield, User as UserIcon, Mail, Filter } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [hideAnonymous, setHideAnonymous] = useState(true); // Default to hiding anonymous

  useEffect(() => {
    fetchUsers();
  }, []);

  // 1. Fetch Users
  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("lastLogin", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Filter Logic (Runs whenever search or toggle changes)
  useEffect(() => {
    let result = users;

    // Filter by Search (Email or Name)
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(u => 
        u.email?.toLowerCase().includes(lowerSearch) || 
        u.displayName?.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter Anonymous
    if (hideAnonymous) {
      result = result.filter(u => !u.isAnonymous && u.email);
    }

    setFilteredUsers(result);
  }, [search, hideAnonymous, users]);

  // 3. Delete User Action
  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Are you sure? This only removes them from this list, not from Auth.")) return;
    
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers(users.filter(u => u.uid !== uid));
      toast.success("User removed from database");
    } catch (error) {
      toast.error("Failed to remove user");
    }
  };

  if (loading) return <div className="p-8">Loading users...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
          Total Registered: {users.filter(u => !u.isAnonymous).length}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by email or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="flex items-center gap-2 cursor-pointer select-none border px-4 py-2 rounded-lg hover:bg-gray-50 transition w-full md:w-auto justify-center">
            <input 
              type="checkbox" 
              checked={hideAnonymous}
              onChange={(e) => setHideAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Hide Anonymous</span>
          </label>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">User</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Last Login</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  No users found matching your filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {user.photoURL ? (
                        <Image src={user.photoURL} alt="avatar" width={40} height={40} className="rounded-full border" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.displayName || "Unknown"}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />
                          {user.email || "No Email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isAnonymous ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Guest
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteUser(user.uid)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Remove User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}