import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import MainLayout from './layouts/MainLayout';
import Overview from './pages/Overview';
import Orders from './components/Orders';
import Menu from './pages/Menu';
import AddMenu from './components/AddMenu';
import Tables from './pages/Tables';
import KitchenOrders from './pages/KitchenOrders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        <Route element={<MainLayout />}>
          {/* Admin */}
          <Route path="/admin/overview" element={<Overview />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/menu" element={<Menu />} />
          <Route path="/admin/add-menu" element={<AddMenu />} />

          {/* Cashier */}
          <Route path="/cashier/tables" element={<Tables />} />
          <Route path="/cashier/orders" element={<Orders />} />

          {/* Kitchen */}
          <Route path="/kitchen/orders" element={<KitchenOrders />} />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}
