// import Footer from './(admissions)/_components/Footer/Footer';
// import Navbar from './(admissions)/_components/Navbar/Navbar';
import ApplicationCarousel from "./(admissions)/_components/ApplicationCarousel/ApplicationCarousel";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function Home() {
  await sleep(2000); // forces loading.tsx to show

  return (
    <div>
      <ApplicationCarousel />
    </div>
  );
}
