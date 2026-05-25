import { HeroSection } from '@/components/home/hero-section';
import { WhyChooseSection } from '@/components/home/why-choose-section';
import { ServicesSection } from '@/components/home/services-section';
import { FeaturedPackages } from '@/components/home/featured-packages';
import { FeaturedActivities } from '@/components/home/featured-activities';
import { AvailableVehicles } from '@/components/home/available-vehicles';
import { PopularDestinations } from '@/components/home/popular-destinations';
import { WelcomeBanner } from '@/components/home/welcome-banner';
import { Testimonials } from '@/components/home/testimonials';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhyChooseSection />
      <ServicesSection />
      <FeaturedPackages />
      <FeaturedActivities />
      <AvailableVehicles />
      <PopularDestinations />
      <WelcomeBanner />
      <Testimonials />
    </>
  );
}
