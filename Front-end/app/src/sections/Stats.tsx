import { Disc3, Users, Music } from 'lucide-react';

const stats = [
  { icon: Disc3, value: '10K+', label: 'Records' },
  { icon: Users, value: '500+', label: 'Artists' },
  { icon: Music, value: '50+', label: 'Genres' },
];

export function Stats() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(251, 191, 36, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
            <Disc3 className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-50 mb-4">
            The Sound You <span className="text-amber-400 italic">Deserve</span>
          </h2>
          <p className="text-lg text-amber-100/60 max-w-2xl mx-auto">
            Every record in our collection is carefully inspected, graded, and packaged to deliver the purest analog listening experience.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm sm:text-base text-amber-100/60">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
