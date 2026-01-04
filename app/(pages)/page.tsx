import Footer from './(admissions)/_components/Footer/Footer';
import Navbar from './(admissions)/_components/Navbar/Navbar';
import ApplicationCarousel from './(admissions)/_components/ApplicationCarousel/ApplicationCarousel';

export default function Home() {
  return (
    <div>
      {/* <Navbar /> */}
      <ApplicationCarousel />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20">
        {/* <p>Halo! Welcome to the HackDavis template repo :D</p> */}
      </div>
      {/* <Footer /> */}
    </div>
  );
}
