"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { uploadProductImage } from "@/lib/services/product-service"; // Reuse our Cloudinary uploader
import { Save, Upload, Plus, Trash2, Layout, Type, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // State for all settings
  const [config, setConfig] = useState({
    // General
    storeName: "My Pro Store",
    supportEmail: "support@example.com",
    currency: "INR",
    
    // Top Bar
    announcement: "Free Shipping on all orders over ₹1999",
    showAnnouncement: true,

    // Hero Section
    hero: {
      title: "New Season Arrivals",
      subtitle: "Check out the latest trends for this summer.",
      buttonText: "Shop Now",
      buttonLink: "/products",
      image: "", // URL
    },

    // Offer Cards (Array)
    offers: [
      { id: 1, title: "Summer Sale", subtitle: "Up to 50% Off", image: "", link: "/sale" }
    ]
  });

  // 1. Fetch Settings on Load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "layout"); // Singleton document
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 2. Save Handler
  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "layout"), config);
      toast.success("Store layout updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // 3. Image Upload Handler
  const handleImageUpload = async (file: File, section: string, index?: number) => {
    try {
      toast.loading("Uploading image...");
      const url = await uploadProductImage(file);
      
      if (section === "hero") {
        setConfig(prev => ({ ...prev, hero: { ...prev.hero, image: url } }));
      } else if (section === "offer" && index !== undefined) {
        const newOffers = [...config.offers];
        newOffers[index].image = url;
        setConfig(prev => ({ ...prev, offers: newOffers }));
      }
      
      toast.dismiss();
      toast.success("Image uploaded");
    } catch (error) {
      toast.dismiss();
      toast.error("Upload failed");
    }
  };

  // Helper: Add/Remove Offer Cards
  const addOfferCard = () => {
    setConfig(prev => ({
      ...prev,
      offers: [...prev.offers, { id: Date.now(), title: "New Offer", subtitle: "Description", image: "", link: "/" }]
    }));
  };

  const removeOfferCard = (index: number) => {
    const newOffers = config.offers.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, offers: newOffers }));
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Store Customization</h1>
           <p className="text-gray-500">Manage your home page appearance and settings.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-black text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition shadow-lg"
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-8">
        {["general", "hero", "offers"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "hero" ? "Banner & Hero" : tab === "offers" ? "Offer Cards" : "General Info"}
          </button>
        ))}
      </div>

      {/* --- TAB CONTENT: GENERAL --- */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2"> <Layout className="h-4 w-4"/> Basic Details</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Store Name</label>
              <input 
                value={config.storeName} 
                onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                className="w-full border p-2 rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Support Email</label>
              <input 
                value={config.supportEmail} 
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                className="w-full border p-2 rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select 
                value={config.currency} 
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                className="w-full border p-2 rounded bg-white"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold flex items-center gap-2"> <Type className="h-4 w-4"/> Announcement Bar</h3>
            <div className="flex items-center gap-3">
               <input 
                 type="checkbox" 
                 checked={config.showAnnouncement} 
                 onChange={(e) => setConfig({ ...config, showAnnouncement: e.target.checked })}
                 className="h-5 w-5"
               />
               <span className="text-sm font-medium">Show Announcement Bar</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bar Text</label>
              <input 
                value={config.announcement} 
                onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
                className="w-full border p-2 rounded" 
                placeholder="e.g. Sale ends tonight!"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: HERO --- */}
      {activeTab === "hero" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Preview & Upload */}
           <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-1">
              <label className="block text-sm font-medium mb-3">Hero Image</label>
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group">
                 {config.hero.image ? (
                   <Image src={config.hero.image} alt="Hero" fill className="object-cover" />
                 ) : (
                   <span className="text-gray-400 text-xs">No Image</span>
                 )}
                 <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                    <span className="text-white text-xs font-bold flex items-center gap-1"><Upload className="h-3 w-3"/> Change</span>
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "hero")} />
                 </label>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">Recommended: 1920x600px</p>
           </div>

           {/* Text Settings */}
           <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-2 space-y-4">
              <h3 className="font-bold mb-4">Banner Content</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Headline</label>
                <input 
                  value={config.hero.title} 
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                  className="w-full border p-2 rounded font-bold text-lg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtitle</label>
                <textarea 
                  value={config.hero.subtitle} 
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                  className="w-full border p-2 rounded h-20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium mb-1">Button Text</label>
                    <input 
                      value={config.hero.buttonText} 
                      onChange={(e) => setConfig({ ...config, hero: { ...config.hero, buttonText: e.target.value } })}
                      className="w-full border p-2 rounded" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Link URL</label>
                    <input 
                      value={config.hero.buttonLink} 
                      onChange={(e) => setConfig({ ...config, hero: { ...config.hero, buttonLink: e.target.value } })}
                      className="w-full border p-2 rounded" 
                    />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- TAB CONTENT: OFFERS --- */}
      {activeTab === "offers" && (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
             <div>
                <h3 className="font-bold text-blue-900">Promotional Cards</h3>
                <p className="text-sm text-blue-700">These appear right below the main banner.</p>
             </div>
             <button onClick={addOfferCard} className="bg-white border text-blue-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50">
               <Plus className="h-4 w-4" /> Add Card
             </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {config.offers.map((offer, index) => (
                <div key={offer.id} className="bg-white p-4 rounded-xl border shadow-sm relative group">
                   
                   {/* Remove Button */}
                   <button 
                     onClick={() => removeOfferCard(index)}
                     className="absolute top-2 right-2 z-10 bg-white text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition border"
                   >
                     <Trash2 className="h-4 w-4" />
                   </button>

                   {/* Image */}
                   <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-4 border border-dashed border-gray-300 flex items-center justify-center">
                      {offer.image ? (
                        <Image src={offer.image} alt="Offer" fill className="object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                        <span className="text-white text-xs font-bold">Upload</span>
                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "offer", index)} />
                      </label>
                   </div>

                   {/* Inputs */}
                   <div className="space-y-3">
                      <input 
                        value={offer.title}
                        onChange={(e) => {
                          const newOffers = [...config.offers];
                          newOffers[index].title = e.target.value;
                          setConfig({ ...config, offers: newOffers });
                        }}
                        className="w-full border-b p-1 font-bold text-sm focus:border-black outline-none"
                        placeholder="Card Title"
                      />
                      <input 
                        value={offer.subtitle}
                        onChange={(e) => {
                          const newOffers = [...config.offers];
                          newOffers[index].subtitle = e.target.value;
                          setConfig({ ...config, offers: newOffers });
                        }}
                        className="w-full border-b p-1 text-xs text-gray-500 focus:border-black outline-none"
                        placeholder="Subtitle / Discount"
                      />
                      <input 
                        value={offer.link}
                        onChange={(e) => {
                          const newOffers = [...config.offers];
                          newOffers[index].link = e.target.value;
                          setConfig({ ...config, offers: newOffers });
                        }}
                        className="w-full border-b p-1 text-xs text-blue-600 focus:border-black outline-none"
                        placeholder="Link URL (/sale)"
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

    </div>
  );
}