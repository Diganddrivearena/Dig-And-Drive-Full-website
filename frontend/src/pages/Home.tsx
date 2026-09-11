import { Features } from "@/sections/Features";
import { Categories } from "@/sections/Categories";
import { RotatingPromoBanner } from "@/sections/RotatingPromoBanner";
import { HomeProducts } from "@/sections/HomeProducts";
import { ExperienceTracks } from "@/sections/ExperienceTracks";
import { Events } from "@/sections/Events";
import { About } from "@/sections/About";
import { FAQ } from "@/sections/FAQ";
import { Contact } from "@/sections/Contact";

export function Home() {
  return (
    <div className="flex flex-col">
      <RotatingPromoBanner />
      <Features />
      <Categories />
      <HomeProducts />
      <ExperienceTracks />
      <Events />
      <About />
      <FAQ />
      <Contact />
    </div>
  );
}
