"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  Save, Upload, Plus, Trash2, Layout, Type, Image as ImageIcon, 
  Loader2, Globe, Phone, Share2, Shield, AlertTriangle, Palette, Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

 

// --- CLOUDINARY UPLOAD HELPER ---
// ⚠️ REPLACE WITH YOUR ACTUAL CLOUDINARY DETAILS OR ENV VARIABLES
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your-upload-preset";

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "ecommerce-store"); // Optional folder

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Cloudinary upload failed");
  const data = await res.json();
  return data.secure_url;
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Comprehensive Config State
  const [config, setConfig] = useState({
    // 1. General & SEO
    storeName: "Rah By Rabanda",
    storeDescription: "The best place to buy amazing products.",
    currency: "INR",
    maintenanceMode: false,
    
    // 2. Branding & Appearance
    logo: "",
    primaryColor: "#000000",
    
    // 3. Contact & Social
    supportEmail: "support@example.com",
    supportPhone: "+91 98765 43210",
    address: "123, Fashion Street, Kerala, India",
    social: {
      instagram: "",
      facebook: "",
      twitter: "",
      whatsapp: ""
    },

    // 4. Header & Hero
    showAnnouncement: true,
    announcement: "Free Shipping on all orders over ₹1999",
    hero: {
      title: "New Season Arrivals",
      subtitle: "Check out the latest trends for this summer.",
      buttonText: "Shop Now",
      buttonLink: "/products",
      image: "",
      alignment: "left", // 'left' | 'center'
      overlayOpacity: 40 // 0-100
    },

    // 5. Offer Cards (Promotions)
    offers: [
      { id: 1, title: "Summer Sale", subtitle: "Up to 50% Off", image: "", link: "/sale" }
    ],

    // 6. Store Perks (Value Props)
    perks: [
      { id: 1, title: "Free Shipping", subtitle: "On orders over ₹499", icon: "truck" },
      { id: 2, title: "Secure Payment", subtitle: "100% protected payments", icon: "shield" },
    ]
  });

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "layout");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Save Handler
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "layout"), config);
      toast.success("Store settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Image Uploader
  const handleImageUpload = async (file: File, section: string, index?: number) => {
    try {
      toast.loading("Uploading to Cloudinary...");
      const url = await uploadToCloudinary(file);
      
      if (section === "hero") {
        setConfig(prev => ({ ...prev, hero: { ...prev.hero, image: url } }));
      } else if (section === "logo") {
        setConfig(prev => ({ ...prev, logo: url }));
      } else if (section === "offer" && index !== undefined) {
        const newOffers = [...config.offers];
        newOffers[index].image = url;
        setConfig(prev => ({ ...prev, offers: newOffers }));
      }
      
      toast.dismiss();
      toast.success("Image uploaded");
    } catch (error) {
      toast.dismiss();
      toast.error("Upload failed. Check console.");
      console.error(error);
    }
  };

  // Array Helpers
  const addOffer = () => setConfig(prev => ({ ...prev, offers: [...prev.offers, { id: Date.now(), title: "New Offer", subtitle: "Details", image: "", link: "/" }] }));
  const removeOffer = (idx: number) => setConfig(prev => ({ ...prev, offers: prev.offers.filter((_, i) => i !== idx) }));

  const addPerk = () => setConfig(prev => ({ ...prev, perks: [...prev.perks, { id: Date.now(), title: "New Feature", subtitle: "Description", icon: "star" }] }));
  const removePerk = (idx: number) => setConfig(prev => ({ ...prev, perks: prev.perks.filter((_, i) => i !== idx) }));

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>;

  return (
    <div className="max-w-6xl mx-auto pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 sticky top-0 bg-slate-50 z-20 py-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
           <p className="text-gray-500">Customize appearance, content, and features.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition shadow-lg disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto gap-6 border-b mb-8 no-scrollbar">
        {[
          { id: "general", label: "General & SEO", icon: Globe },
          { id: "brand", label: "Branding", icon: Palette },
          { id: "hero", label: "Home Page", icon: Layout },
          { id: "social", label: "Contact", icon: Share2 },
          { id: "features", label: "Perks & Offers", icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* --- GENERAL TAB --- */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2"><Globe className="h-5 w-5"/> Store Details</h3>
              <div>
                <label className="label">Store Name</label>
                <input 
                  value={config.storeName} 
                  onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                  className="input" 
                />
              </div>
              <div>
                <label className="label">Store Description (SEO)</label>
                <textarea 
                  value={config.storeDescription} 
                  onChange={(e) => setConfig({ ...config, storeDescription: e.target.value })}
                  className="input h-24" 
                  placeholder="Used for meta description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="label">Currency</label>
                   <select 
                     value={config.currency} 
                     onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                     className="input bg-white"
                   >
                     <option value="INR">INR (₹)</option>
                     <option value="USD">USD ($)</option>
                     <option value="EUR">EUR (€)</option>
                   </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 border-red-100">
               <h3 className="font-bold text-lg flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5"/> Danger Zone</h3>
               <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <span className="font-bold text-gray-900 block">Maintenance Mode</span>
                    <span className="text-xs text-red-600">Store will be hidden from visitors.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={config.maintenanceMode}
                      onChange={(e) => setConfig({...config, maintenanceMode: e.target.checked})} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
               </div>
            </div>
          </div>
        )}

        {/* --- BRANDING TAB --- */}
        {activeTab === "brand" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg mb-4">Store Logo</h3>
                <div className="flex items-center gap-6">
                   <div className="relative h-24 w-24 bg-gray-100 rounded-xl border border-dashed flex items-center justify-center overflow-hidden">
                      {config.logo ? (
                        <Image src={config.logo} alt="Logo" fill className="object-contain p-2" />
                      ) : (
                        <span className="text-xs text-gray-400">No Logo</span>
                      )}
                   </div>
                   <div>
                      <label className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-50 transition shadow-sm">
                         Upload Logo
                         <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "logo")} />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">Recommended: 200x200px PNG (Cloudinary)</p>
                   </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg mb-4">Theme Colors</h3>
                <div>
                   <label className="label">Primary Brand Color</label>
                   <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={config.primaryColor} 
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        className="h-10 w-20 p-1 rounded cursor-pointer border" 
                      />
                      <input 
                        type="text" 
                        value={config.primaryColor} 
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        className="input uppercase font-mono" 
                      />
                   </div>
                   <p className="text-xs text-gray-400 mt-2">Used for buttons, links, and highlights.</p>
                </div>
             </div>
           </div>
        )}

        {/* --- HERO TAB --- */}
        {activeTab === "hero" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Preview */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border shadow-sm">
                 <label className="label">Hero Banner Image</label>
                 <div className="relative aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group">
                    {config.hero.image ? (
                      <Image src={config.hero.image} alt="Hero" fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                       <span className="text-white font-bold flex items-center gap-2"><Upload className="h-4 w-4"/> Replace</span>
                       <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero")} />
                    </label>
                 </div>
                 
                 <div className="mt-6">
                    <label className="label">Announcement Bar</label>
                    <div className="flex items-center gap-3 mb-2">
                       <input type="checkbox" checked={config.showAnnouncement} onChange={e => setConfig({...config, showAnnouncement: e.target.checked})} className="h-4 w-4 accent-black" />
                       <span className="text-sm">Show Top Bar</span>
                    </div>
                    <input 
                      value={config.announcement} 
                      onChange={e => setConfig({...config, announcement: e.target.value})}
                      className="input"
                      placeholder="e.g. Free shipping..."
                    />
                 </div>
              </div>

              {/* Text Content */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                 <h3 className="font-bold text-lg">Hero Content</h3>
                 <div>
                   <label className="label">Headline</label>
                   <input 
                     value={config.hero.title} 
                     onChange={(e) => setConfig({...config, hero: {...config.hero, title: e.target.value}})}
                     className="input font-bold text-lg" 
                   />
                 </div>
                 <div>
                   <label className="label">Subtitle</label>
                   <textarea 
                     value={config.hero.subtitle} 
                     onChange={(e) => setConfig({...config, hero: {...config.hero, subtitle: e.target.value}})}
                     className="input h-20" 
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="label">Button Text</label>
                       <input 
                         value={config.hero.buttonText} 
                         onChange={(e) => setConfig({...config, hero: {...config.hero, buttonText: e.target.value}})}
                         className="input" 
                       />
                    </div>
                    <div>
                       <label className="label">Button Link</label>
                       <input 
                         value={config.hero.buttonLink} 
                         onChange={(e) => setConfig({...config, hero: {...config.hero, buttonLink: e.target.value}})}
                         className="input" 
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                       <label className="label">Text Alignment</label>
                       <select 
                         value={config.hero.alignment} 
                         onChange={(e) => setConfig({...config, hero: {...config.hero, alignment: e.target.value}})}
                         className="input bg-white"
                       >
                         <option value="left">Left Aligned</option>
                         <option value="center">Center Aligned</option>
                       </select>
                    </div>
                    <div>
                       <label className="label">Overlay Opacity (%)</label>
                       <input 
                         type="range" min="0" max="90" 
                         value={config.hero.overlayOpacity} 
                         onChange={(e) => setConfig({...config, hero: {...config.hero, overlayOpacity: Number(e.target.value)}})}
                         className="w-full mt-2 accent-black" 
                       />
                       <span className="text-xs text-gray-500 text-right block">{config.hero.overlayOpacity}%</span>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* --- CONTACT & SOCIAL TAB --- */}
        {activeTab === "social" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                 <h3 className="font-bold text-lg flex items-center gap-2"><Phone className="h-5 w-5"/> Contact Info</h3>
                 <div>
                   <label className="label">Support Email</label>
                   <input 
                     value={config.supportEmail} 
                     onChange={(e) => setConfig({...config, supportEmail: e.target.value})}
                     className="input" 
                   />
                 </div>
                 <div>
                   <label className="label">Support Phone</label>
                   <input 
                     value={config.supportPhone} 
                     onChange={(e) => setConfig({...config, supportPhone: e.target.value})}
                     className="input" 
                   />
                 </div>
                 <div>
                   <label className="label">Physical Address</label>
                   <textarea 
                     value={config.address} 
                     onChange={(e) => setConfig({...config, address: e.target.value})}
                     className="input h-24" 
                   />
                 </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                 <h3 className="font-bold text-lg flex items-center gap-2"><Share2 className="h-5 w-5"/> Social Links</h3>
                 {['instagram', 'facebook', 'twitter', 'whatsapp'].map((platform) => (
                   <div key={platform}>
                      <label className="label capitalize">{platform} URL</label>
                      <input 
                        value={config.social[platform as keyof typeof config.social]} 
                        onChange={(e) => setConfig({...config, social: {...config.social, [platform]: e.target.value}})}
                        className="input" 
                        placeholder={`https://${platform}.com/...`}
                      />
                   </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- FEATURES & PERKS TAB --- */}
        {activeTab === "features" && (
           <div className="space-y-8">
              
              {/* Store Perks */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="font-bold text-lg">Store Perks</h3>
                       <p className="text-sm text-gray-500">Icons displayed on homepage (e.g. Free Shipping).</p>
                    </div>
                    <button onClick={addPerk} className="btn-secondary text-sm"><Plus className="h-4 w-4" /> Add Perk</button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.perks.map((perk, i) => (
                       <div key={perk.id} className="p-4 border rounded-xl flex items-start gap-3 bg-gray-50 relative group">
                          <button onClick={() => removePerk(i)} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm border"><Trash2 className="h-3 w-3"/></button>
                          
                          <div className="p-3 bg-white rounded-lg border">
                             {/* Icon Selector Placeholder */}
                             <Shield className="h-6 w-6 text-gray-700" />
                          </div>
                          <div className="flex-1 space-y-2">
                             <input 
                               value={perk.title}
                               onChange={e => {
                                 const newPerks = [...config.perks];
                                 newPerks[i].title = e.target.value;
                                 setConfig({...config, perks: newPerks});
                               }}
                               className="w-full font-bold bg-transparent border-b border-transparent focus:border-black outline-none"
                               placeholder="Title"
                             />
                             <input 
                               value={perk.subtitle}
                               onChange={e => {
                                 const newPerks = [...config.perks];
                                 newPerks[i].subtitle = e.target.value;
                                 setConfig({...config, perks: newPerks});
                               }}
                               className="w-full text-sm text-gray-500 bg-transparent border-b border-transparent focus:border-black outline-none"
                               placeholder="Subtitle"
                             />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Offer Cards */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="font-bold text-lg">Promotional Cards</h3>
                       <p className="text-sm text-gray-500">Banners below the hero section.</p>
                    </div>
                    <button onClick={addOffer} className="btn-secondary text-sm"><Plus className="h-4 w-4" /> Add Card</button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {config.offers.map((offer, i) => (
                       <div key={offer.id} className="relative border rounded-xl overflow-hidden group">
                          <button onClick={() => removeOffer(i)} className="absolute top-2 right-2 z-10 bg-white text-red-500 p-1.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition"><Trash2 className="h-4 w-4"/></button>
                          <div className="relative h-40 bg-gray-100 w-full group/image">
                             {offer.image && <Image src={offer.image} alt="" fill className="object-cover" />}
                             <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/image:opacity-100 transition cursor-pointer text-white font-bold">
                                Upload
                                <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "offer", i)} />
                             </label>
                          </div>
                          <div className="p-4 space-y-2 bg-white">
                             <input 
                               value={offer.title} 
                               onChange={e => {
                                 const newOffers = [...config.offers];
                                 newOffers[i].title = e.target.value;
                                 setConfig({...config, offers: newOffers});
                               }}
                               className="w-full font-bold text-sm border-b focus:border-black outline-none pb-1"
                               placeholder="Title"
                             />
                             <input 
                               value={offer.subtitle} 
                               onChange={e => {
                                 const newOffers = [...config.offers];
                                 newOffers[i].subtitle = e.target.value;
                                 setConfig({...config, offers: newOffers});
                               }}
                               className="w-full text-xs text-gray-500 border-b focus:border-black outline-none pb-1"
                               placeholder="Subtitle"
                             />
                             <input 
                               value={offer.link} 
                               onChange={e => {
                                 const newOffers = [...config.offers];
                                 newOffers[i].link = e.target.value;
                                 setConfig({...config, offers: newOffers});
                               }}
                               className="w-full text-xs text-blue-600 border-b focus:border-black outline-none pb-1"
                               placeholder="Link URL"
                             />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

      </div>

      <style jsx>{`
        .label { @apply block text-sm font-bold text-gray-700 mb-1.5; }
        .input { @apply w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition; }
        .btn-secondary { @apply bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 flex items-center gap-2 transition; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}