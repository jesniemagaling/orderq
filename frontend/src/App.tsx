import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Search from './pages/Search';
import Menu from './pages/Menu';
import FoodDetails from './pages/FoodDetails';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import PaymentMethod from './pages/PaymentMethod';
import OrderStatus from './pages/OrderStatus';
import Receipt from './pages/Receipt';
import OrderRedirect from './pages/OrderRedirect';
import SessionExpired from './pages/SessionExpired';
import SessionGuard from './components/SessionGuard';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/order" element={<OrderRedirect />} />
          <Route path="/session-expired" element={<SessionExpired />} />

          <Route
            path="/"
            element={
              <SessionGuard>
                <Home />
              </SessionGuard>
            }
          />

          <Route
            path="/search"
            element={
              <SessionGuard>
                <Search />
              </SessionGuard>
            }
          />

          <Route
            path="/menu"
            element={
              <SessionGuard>
                <Menu />
              </SessionGuard>
            }
          />

          <Route
            path="/menu/:id"
            element={
              <SessionGuard>
                <FoodDetails />
              </SessionGuard>
            }
          />

          <Route
            path="/cart"
            element={
              <SessionGuard>
                <Cart />
              </SessionGuard>
            }
          />

          <Route
            path="/orders"
            element={
              <SessionGuard>
                <Orders />
              </SessionGuard>
            }
          />

          <Route
            path="/payment-method"
            element={
              <SessionGuard>
                <PaymentMethod />
              </SessionGuard>
            }
          />

          <Route
            path="/order-status/:orderId"
            element={
              <SessionGuard>
                <OrderStatus />
              </SessionGuard>
            }
          />

          <Route
            path="/receipt/:orderId"
            element={
              <SessionGuard>
                <Receipt />
              </SessionGuard>
            }
          />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
