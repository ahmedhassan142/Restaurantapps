// components/Footer.tsx
import Link from 'next/link';
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4">
              Epicurean<span className="text-orange-500">.</span>
            </h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Experience culinary excellence with our carefully crafted dishes 
              made from the finest local ingredients.
            </p>
            <div className="flex space-x-4">
              {[Facebook, Instagram, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <div className="space-y-3">
              {['Menu', 'About', 'Reservations', 'Contact'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="block text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <MapPin className="w-4 h-4 mr-3 flex-shrink-0" />
                <span>123 Gourmet Street, Food City, FC 12345</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Mail className="w-4 h-4 mr-3 flex-shrink-0" />
                <span>info@epicurean.com</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Opening Hours</h4>
            <div className="space-y-2 text-gray-400">
              <div className="flex justify-between">
                <span>Mon - Thu</span>
                <span>11:00 - 22:00</span>
              </div>
              <div className="flex justify-between">
                <span>Fri - Sat</span>
                <span>11:00 - 23:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span>12:00 - 21:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Epicurean Restaurant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;