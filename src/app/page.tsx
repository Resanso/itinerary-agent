'use client';

import dynamic from 'next/dynamic';

const MapsPlanner = dynamic(() => import("@/components/MapsPlanner"), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <MapsPlanner />
    </main>
  );
}
