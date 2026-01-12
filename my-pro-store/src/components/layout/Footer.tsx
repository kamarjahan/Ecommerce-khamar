import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        
        {/* Brand */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">rah<span className="text-blue-500">by rabanda</span></h2>
          <p className="text-sm leading-relaxed mb-6">
            Your one-stop destination for premium fashion and lifestyle products. Quality guaranteed.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="hover:text-white transition"><Instagram className="h-5 w-5" /></a>
            <a href="#" className="hover:text-white transition"><Twitter className="h-5 w-5" /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition">Home</Link></li>
            <li><Link href="/products" className="hover:text-white transition">Shop All</Link></li>
            <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="text-white font-bold mb-4">Customer Care</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/orders" className="hover:text-white transition">Track Order</Link></li>
            <li><Link href="/returns" className="hover:text-white transition">Returns & Exchange</Link></li>
            <li><Link href="/shipping" className="hover:text-white transition">Shipping Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-bold mb-4">Contact Us</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-500 shrink-0" />
              <span>123 Fashion Street, <br/>New Delhi, India 110001</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-500 shrink-0" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-500 shrink-0" />
              <span>support@mystore.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} MyStore Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
