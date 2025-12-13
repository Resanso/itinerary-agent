'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/utils/trpc';
import { Button, Card, Input, Select, Container } from '@/components/ui';
import { Search, Leaf } from 'lucide-react';

const CITIES = ['Bali', 'Bandung', 'Yogyakarta'];
const PACE_OPTIONS = [
  { value: 'Relaxed', label: 'Relaxed' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Fast-Paced', label: 'Fast-Paced' },
];
const INTEREST_OPTIONS = [
  { value: 'Nature', label: 'Nature' },
  { value: 'Culinary', label: 'Culinary' },
  { value: 'Culture', label: 'Culture' },
  { value: 'History', label: 'History' },
  { value: 'Hidden Gem', label: 'Hidden Gem' },
];

export default function CreatePage() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [days, setDays] = useState<number>(3);
  const [pace, setPace] = useState<'Relaxed' | 'Moderate' | 'Fast-Paced'>('Moderate');
  const [interests, setInterests] = useState<string[]>([]);
  const [ecoFocus, setEcoFocus] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatePlan = trpc.itinerary.generatePlan.useMutation({
    onSuccess: (data) => {
      // Simpan data ke sessionStorage untuk digunakan di halaman result
      sessionStorage.setItem('itineraryData', JSON.stringify(data));
      // Redirect ke halaman result
      router.push('/result');
    },
    onError: (error) => {
      console.error('Error generating plan:', error);
      setErrors({ submit: error.message || 'Failed to generate itinerary' });
    },
  });

  const handleInterestToggle = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!city) newErrors.city = 'City is required';
    if (!days || days < 1 || days > 10) {
      newErrors.days = 'Days must be between 1 and 10';
    }
    if (interests.length === 0) {
      newErrors.interests = 'At least one interest is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit form
    generatePlan.mutate({
      city,
      days,
      pace,
      interests: interests as ('Nature' | 'Culinary' | 'Culture' | 'History' | 'Hidden Gem')[],
      ecoFocus,
    });
  };

  return (
    <main className="min-h-screen py-12 pt-28" style={{ backgroundColor: 'var(--color-background-main)' }}>
      <Container maxWidth="lg" padding="md">
        <div className="max-w-2xl mx-auto">
          <Card variant="glass" padding="lg" className="glass-card">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                Create Your Smart Itinerary
              </h1>
              <p className="text-base sm:text-lg max-w-xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                Tell us about your trip, and we'll craft a sustainable plan just for you
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* City Selection */}
              <div>
                <label className="block text-base font-semibold mb-3 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                  Where are you going?
                </label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary z-10">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g., Kyoto, Japan"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-background-card border border-gray-200 rounded-full px-6 pl-14 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    style={{
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>
                {errors.city && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-status-red-text)' }}>
                    {errors.city}
                  </p>
                )}
              </div>

              {/* Days Input */}
              <div>
                <label className="block text-base font-semibold mb-3 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                  How many days?
                </label>
                <select
                  value={days.toString()}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="w-full bg-background-card border border-gray-200 rounded-full px-6 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                  style={{
                    color: 'var(--color-text-primary)',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236B7280\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1.5rem center',
                    backgroundSize: '12px',
                    paddingRight: '3rem',
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={(i + 1).toString()}>
                      {i + 1} {i === 0 ? 'Day' : 'Days'}
                    </option>
                  ))}
                </select>
                {errors.days && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-status-red-text)' }}>
                    {errors.days}
                  </p>
                )}
              </div>

              {/* Pace Selection */}
              <div>
                <label className="block text-base font-semibold mb-4 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                  What's your travel pace?
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'Relaxed', label: 'Relaxed', subtext: 'Fewer activities, more downtime' },
                    { value: 'Moderate', label: 'Moderate', subtext: 'A balanced mix of sights' },
                    { value: 'Fast-Paced', label: 'Fast-Paced', subtext: 'See as much as possible' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPace(option.value as typeof pace)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        pace === option.value
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                          : 'bg-background-card border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Hidden Radio Input */}
                        <input
                          type="radio"
                          name="pace"
                          value={option.value}
                          checked={pace === option.value}
                          onChange={() => setPace(option.value as typeof pace)}
                          className="hidden"
                        />
                        {/* Visual Radio Indicator */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          pace === option.value
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}>
                          {pace === option.value && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold mb-1 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                            {option.label}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            {option.subtext}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests Selection */}
              <div>
                <label className="block text-base font-semibold mb-4 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                  What are your interests?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INTEREST_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInterestToggle(option.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        interests.includes(option.value)
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                          : 'bg-background-card border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Hidden Checkbox Input */}
                        <input
                          type="checkbox"
                          checked={interests.includes(option.value)}
                          onChange={() => handleInterestToggle(option.value)}
                          className="hidden"
                        />
                        {/* Visual Checkbox Indicator */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          interests.includes(option.value)
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}>
                          {interests.includes(option.value) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.interests && (
                  <p className="mt-2 text-sm" style={{ color: 'var(--color-status-red-text)' }}>
                    {errors.interests}
                  </p>
                )}
              </div>

              {/* Eco Focus Toggle */}
              <div className="flex items-center justify-between p-5 rounded-xl" style={{ backgroundColor: 'var(--color-secondary)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.1 }}>
                    <Leaf className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <div className="font-semibold mb-1 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                      Prioritize sustainability?
                    </div>
                    <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      We'll highlight eco-friendly options.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEcoFocus(!ecoFocus)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
                    ecoFocus ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                      ecoFocus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Error Message */}
              {errors.submit && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-accent-error)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-status-red-text)' }}>
                    {errors.submit}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={generatePlan.isPending}
                  className="rounded-full h-12 font-semibold text-lg"
                >
                  {generatePlan.isPending ? 'Generating...' : 'Generate Itinerary'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </Container>
    </main>
  );
}

