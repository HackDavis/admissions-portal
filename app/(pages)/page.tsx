import Footer from './(admissions)/_components/Footer/Footer';
import Navbar from './(admissions)/_components/Navbar/Navbar';

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
        <p>Halo! Welcome to the HackDavis template repo :D</p>
      </div>
      <Footer />
    </div>
  );
}
