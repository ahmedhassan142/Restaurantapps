// app/about/page.tsx
import { Award, Users, Clock, Heart } from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { icon: <Award className="w-8 h-8" />, number: '15+', label: 'Years Experience' },
    { icon: <Users className="w-8 h-8" />, number: '50k+', label: 'Happy Customers' },
    { icon: <Clock className="w-8 h-8" />, number: '100+', label: 'Menu Items' },
    { icon: <Heart className="w-8 h-8" />, number: '25+', label: 'Awards Won' }
  ];

  return (
    <div className="pt-20 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Story
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            For over 15 years, Epicurean has been serving exceptional cuisine 
            crafted with passion, creativity, and the finest local ingredients.
          </p>
        </div>
      </section>

      Stats Section
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-orange-600 mb-4 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Crafting Memorable Dining Experiences
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2008 by Chef Marco Bellini, Epicurean began as a small 
                  neighborhood bistro with a simple mission: to create extraordinary 
                  dining experiences using locally sourced, seasonal ingredients.
                </p>
                <p>
                  Today, we continue that tradition while innovating with modern 
                  culinary techniques. Our team of passionate chefs and service 
                  professionals work together to ensure every visit is memorable.
                </p>
                <p>
                  We believe that great food brings people together, and we're 
                  committed to creating dishes that not only satisfy the palate 
                  but also tell a story of quality, tradition, and innovation.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl h-96 shadow-xl" />
          </div>
        </div>
      </section>
    </div>
  );
}