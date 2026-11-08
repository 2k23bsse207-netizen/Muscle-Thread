import Hero from '../components/hero/Hero'
import ShopByCategory from '../components/product/ShopByCategory'
import Product from '../components/product/Product'
import MoveMarquee from '../components/Testimonials/MoveMarquee'
import DisciplineSection from '../components/Testimonials/DisciplineSection'
import OurStory from '../components/Story/OurStory'

export default function Home() {
  return (
    <main>
      <Hero />
      <ShopByCategory />
      <Product />
      <MoveMarquee />
      <DisciplineSection />
      <OurStory />
    </main>
  )
}
