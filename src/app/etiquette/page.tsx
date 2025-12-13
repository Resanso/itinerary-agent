'use client';

import { useSearchParams } from 'next/navigation';
import { Container, Card } from '@/components/ui';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface EtiquetteItem {
  type: 'do' | 'dont' | 'warning';
  title: string;
  description: string;
}

// Mock data - in production, this would come from an API or database
const etiquetteData: Record<string, EtiquetteItem[]> = {
  'Bali': [
    {
      type: 'do',
      title: 'Wear Appropriate Clothing',
      description: 'Cover shoulders and knees when visiting temples. Sarongs are often provided, but bringing your own shows respect.',
    },
    {
      type: 'do',
      title: 'Use Right Hand for Giving',
      description: 'In Balinese culture, the left hand is considered impure. Always use your right hand when giving or receiving items.',
    },
    {
      type: 'dont',
      title: 'Don\'t Point with Index Finger',
      description: 'Pointing with your index finger is considered rude. Use your thumb or whole hand instead.',
    },
    {
      type: 'dont',
      title: 'Don\'t Step on Offerings',
      description: 'Small offerings (canang sari) are placed on the ground daily. Be careful not to step on them.',
    },
    {
      type: 'warning',
      title: 'Temple Etiquette',
      description: 'Remove shoes before entering temples. Women should not enter during menstruation. Keep voices low and be respectful.',
    },
  ],
  'Bandung': [
    {
      type: 'do',
      title: 'Respect Prayer Times',
      description: 'During prayer times (especially Friday prayers), avoid loud activities. Many shops may close temporarily.',
    },
    {
      type: 'do',
      title: 'Greet with Salam',
      description: 'Use "Assalamu\'alaikum" when greeting locals. It shows respect for the predominantly Muslim community.',
    },
    {
      type: 'dont',
      title: 'Don\'t Eat in Public During Ramadan',
      description: 'If visiting during Ramadan, avoid eating, drinking, or smoking in public during daylight hours out of respect.',
    },
    {
      type: 'dont',
      title: 'Don\'t Wear Revealing Clothes',
      description: 'Dress modestly, especially when visiting religious sites or traditional areas. Cover shoulders and knees.',
    },
    {
      type: 'warning',
      title: 'Traffic Awareness',
      description: 'Bandung traffic can be heavy. Be patient and use pedestrian crossings. Motorcycles are common, so stay alert.',
    },
  ],
  'Yogyakarta': [
    {
      type: 'do',
      title: 'Respect Javanese Customs',
      description: 'Yogyakarta is the heart of Javanese culture. Show respect for traditional customs and royal traditions.',
    },
    {
      type: 'do',
      title: 'Learn Basic Javanese Greetings',
      description: 'Using "Sugeng enjang" (good morning) or "Matur nuwun" (thank you) is appreciated by locals.',
    },
    {
      type: 'dont',
      title: 'Don\'t Point Feet at People',
      description: 'Feet are considered the lowest part of the body. Never point your feet toward people or sacred objects.',
    },
    {
      type: 'dont',
      title: 'Don\'t Touch Heads',
      description: 'The head is considered sacred. Avoid touching someone\'s head, even children\'s.',
    },
    {
      type: 'warning',
      title: 'Kraton Palace Rules',
      description: 'When visiting the Kraton Palace, dress modestly, speak quietly, and follow all posted rules. Photography may be restricted in certain areas.',
    },
  ],
};

const defaultEtiquette: EtiquetteItem[] = [
  {
    type: 'do',
    title: 'Respect Local Customs',
    description: 'Take time to learn about local customs and traditions before visiting. This shows respect and helps you avoid unintentional offenses.',
  },
  {
    type: 'do',
    title: 'Dress Appropriately',
    description: 'Research dress codes for religious sites and cultural areas. When in doubt, dress more conservatively.',
  },
  {
    type: 'dont',
    title: 'Don\'t Take Photos Without Permission',
    description: 'Always ask before taking photos of people, especially in rural or traditional areas. Some may expect a small tip.',
  },
  {
    type: 'dont',
    title: 'Don\'t Bargain Aggressively',
    description: 'Bargaining is common in markets, but be respectful. Start at 50-70% of asking price and negotiate politely.',
  },
  {
    type: 'warning',
    title: 'General Travel Etiquette',
    description: 'Be patient, smile, and show genuine interest in local culture. A little effort goes a long way in building positive connections.',
  },
];

import { Suspense } from 'react';

function EtiquetteContent() {
  const searchParams = useSearchParams();
  const city = searchParams.get('city') || '';

  const etiquette = city && etiquetteData[city] ? etiquetteData[city] : defaultEtiquette;

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'do':
        return {
          bg: '#F0FDF4',
          icon: CheckCircle,
          iconColor: '#166534',
          textColor: '#15803D',
          titleColor: '#166534',
        };
      case 'dont':
        return {
          bg: '#FEF2F2',
          icon: XCircle,
          iconColor: '#991B1B',
          textColor: '#DC2626',
          titleColor: '#991B1B',
        };
      case 'warning':
        return {
          bg: '#FEF3C7',
          icon: AlertTriangle,
          iconColor: '#F59E0B',
          textColor: '#D97706',
          titleColor: '#F59E0B',
        };
      default:
        return {
          bg: '#F0FDF4',
          icon: Info,
          iconColor: '#166534',
          textColor: '#15803D',
          titleColor: '#166534',
        };
    }
  };

  return (
    <main className="min-h-screen py-12 pt-28" style={{ backgroundColor: 'var(--color-background-main)' }}>
      <Container maxWidth="lg" padding="md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 font-heading" style={{ color: 'var(--color-text-primary)' }}>
            Local Etiquette Guide
            {city && (
              <span className="block text-2xl mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                for {city}
              </span>
            )}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {city 
              ? `Essential do's, don'ts, and warnings for respectful travel in ${city}`
              : 'Essential guidelines for respectful and sustainable travel. Select a city to see specific etiquette tips.'}
          </p>
        </div>

        {/* Etiquette Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {etiquette.map((item, index) => {
            const style = getCardStyle(item.type);
            const Icon = style.icon;
            return (
              <Card
                key={index}
                variant="default"
                padding="lg"
                className="hover-lift transition-all duration-300 rounded-xl shadow-sm"
                style={{ backgroundColor: style.bg }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Icon className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: style.iconColor }} />
                  <h3 
                    className="text-lg font-bold font-heading" 
                    style={{ color: style.titleColor }}
                  >
                    {item.type === 'do' ? 'Do' : item.type === 'dont' ? "Don't" : 'Warning'}
                  </h3>
                </div>
                <h4 className="font-semibold mb-2 font-heading" style={{ color: 'var(--color-text-primary)' }}>
                  {item.title}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: style.textColor }}>
                  {item.description}
                </p>
              </Card>
            );
          })}
        </div>

        {!city && (
          <div className="mt-12 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              💡 Tip: Create an itinerary for a specific city to see location-specific etiquette guidelines.
            </p>
          </div>
        )}
      </Container>
    </main>
  );
}

export default function EtiquettePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EtiquetteContent />
    </Suspense>
  );
}


