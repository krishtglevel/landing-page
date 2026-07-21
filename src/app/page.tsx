import React from 'react'
import Header from '@/component/Header'
import Footer from '@/component/Footer'
import AttributionTracker from "../component/AttributionTracker";
// import logo from '@/public/images/logo.svg'
function page() {
  return (
    <div>
      <Header />
      <AttributionTracker />
      <Footer />
    </div>
  )
}

export default page
