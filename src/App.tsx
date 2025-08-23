import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layouts/MainLayout';
import Home from './pages/Home';
import Search from './pages/Search';
import Menu from './pages/Menu';
import FoodDetails from './pages/FoodDetails';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import PaymentMethod from './pages/PaymentMethod';
import OrderStatus from './pages/OrderStatus';
import Receipt from './pages/Receipt';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/food/:id" element={<FoodDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/payment-method" element={<PaymentMethod />} />
          <Route path="/order-status" element={<OrderStatus />} />
          <Route path="/receipt" element={<Receipt />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
