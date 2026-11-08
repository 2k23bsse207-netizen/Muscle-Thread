import { Outlet } from 'react-router-dom'
import Header from '../components/Header/Header'
import Footer from '../components/footer/Footer'

export default function Layout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
