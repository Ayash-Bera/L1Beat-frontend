import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ChainDetails } from './pages/ChainDetails';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/chain/:chainId" element={<ChainDetails />} />
    </Routes>
  );
}

export default App