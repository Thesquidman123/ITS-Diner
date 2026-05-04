import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import OrderingInterface from './components/OrderingInterface';
import OrderConfirmation from './components/OrderConfirmation';
import './App.css';

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<OrderingInterface />} />
            <Route path="/confirmation/:orderId" element={<OrderConfirmation />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
