import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import CommandPalette from "@/components/CommandPalette";
import SplineBackground from "@/components/SplineBackground";

const AppLayout = () => (
  <div className="relative min-h-screen">
    <SplineBackground />
    <div className="relative z-10 pointer-events-none">
      <Navbar />
      <Ticker />
      <Outlet />
    </div>
    <CommandPalette />
  </div>
);

export default AppLayout;
