import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Overview } from './pages/Overview';
import { Explorer } from './pages/Explorer';
import { Comparison } from './pages/Comparison';
import { Standards } from './pages/Standards';
import { Historical } from './pages/Historical';
import { DataSources } from './pages/DataSources';
import { IngestionMonitor } from './pages/IngestionMonitor';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/comparison" element={<Comparison />} />
            <Route path="/standards" element={<Standards />} />
            <Route path="/historical" element={<Historical />} />
            <Route path="/sources" element={<DataSources />} />
            <Route path="/ingestion" element={<IngestionMonitor />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
