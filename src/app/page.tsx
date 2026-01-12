import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import NoticeBoard from '@/components/NoticeBoard';
import Gallery from '@/components/Gallery';
import Schedule from '@/components/Schedule';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <NoticeBoard />
      <Gallery />
      <Schedule />
      <Footer />
    </main>
  );
}
