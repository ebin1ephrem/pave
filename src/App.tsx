import { BrowserRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "@/auth/session";
import NotFound from "@/pages/not-found";
import SectionPage from "@/pages/section";
import SignIn from "@/pages/sign-in";
import Styleguide from "@/pages/styleguide";
import { SiteLayout } from "@/site/components/site-layout";
import About from "@/site/pages/about";
import Demo from "@/site/pages/demo";
import Faq from "@/site/pages/faq";
import Framework from "@/site/pages/framework";
import Home from "@/site/pages/home";
import Legal from "@/site/pages/legal";
import Pricing from "@/site/pages/pricing";
import Product from "@/site/pages/product";
import WhoItsFor from "@/site/pages/who";

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          {/* Public website */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/product" element={<Product />} />
            <Route path="/framework" element={<Framework />} />
            <Route path="/who-its-for" element={<WhoItsFor />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/contact" element={<Demo />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
          </Route>

          {/* App */}
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/styleguide" element={<Styleguide />} />
          {["/founder/*", "/manager/*", "/customer/*", "/admin/*"].map((path) => (
            <Route key={path} path={path} element={<SectionPage />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}
