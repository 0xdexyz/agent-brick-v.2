import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { SimulationProvider } from "@/lib/engine";
import SolanaAdapters from "@/lib/solanaAdapters";
import { WalletProvider } from "@/lib/wallet";
import Pulse from "@/pages/Pulse";
import Dashboard from "@/pages/Dashboard";
import Leaderboard from "@/pages/Leaderboard";
import Launches from "@/pages/Launches";
import Activity from "@/pages/Activity";
import AgentProfile from "@/pages/AgentProfile";
import TokenDetail from "@/pages/TokenDetail";

const App = () => (
  <SimulationProvider>
    <SolanaAdapters>
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Pulse />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="launches" element={<Launches />} />
            <Route path="activity" element={<Activity />} />
            <Route path="agents/:id" element={<AgentProfile />} />
            <Route path="tokens/:id" element={<TokenDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WalletProvider>
    </SolanaAdapters>
  </SimulationProvider>
);

export default App;
