'use client';

import Section1 from '@/components/main/section1';
import Section2 from '@/components/main/section2';
import Section3 from '@/components/main/section3';
import Section4 from '@/components/main/section4';
import Section5 from '@/components/main/section5';
import Section6 from '@/components/main/section6';

const Page = () => {

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden bg-transparent">
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />
      <Section6 />
    </main>
  );
};

export default Page;
