import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ROLE_HOME, SessionProvider, useSession } from "@/auth/session";
import NotFound from "@/pages/not-found";
import SectionPage from "@/pages/section";
import SignIn from "@/pages/sign-in";
import Styleguide from "@/pages/styleguide";

function Start() {
  const { user } = useSession();
  return <Navigate to={user ? ROLE_HOME[user.role] : "/sign-in"} replace />;
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Start />} />
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
