import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import MainLayout from './layouts/MainLayout';
import SalesLayout from './layouts/SalesLayout';

import Overview from './pages/Overview';
import Sales from './pages/Sales';
import Orders from './components/Orders';
import OrdersHistory from './components/OrderAudit';
import Menu from './pages/Menu';
import AddMenu from './components/AddMenu';
import MenuHistory from './components/MenuAudit';
import Tables from './pages/Tables';
import KitchenOrders from './pages/KitchenOrders';

import DailyIncome from './pages/sales/DailyIncome';
import SalesPerDay from './pages/sales/SalesPerDay';
import SalesSummary from './pages/sales/SalesSummary';
import OrdersPerTable from './pages/sales/OrdersPerTable';
import OrdersPerDay from './pages/sales/OrdersPerDay';
import ItemSales from './pages/sales/ItemSales';
import CategorySales from './pages/sales/CategorySales';
import PaymentMethodBreakdown from './pages/sales/PaymentMethodBreakdown';
import HourlyHeatmap from './pages/sales/HourlyHeatMap';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Main layout */}
        <Route element={<MainLayout />}>
          {/* Admin */}
          <Route path="/admin/overview" element={<Overview />} />

          {/* Sales*/}
          <Route path="/admin/sales" element={<SalesLayout />}>
            {/* MAIN SALES PAGE */}
            <Route index element={<Sales />} />

            {/* SUB PAGES */}
            <Route path="daily-income" element={<DailyIncome />} />
            <Route path="sales-summary" element={<SalesSummary />} />
            <Route path="sales-per-day" element={<SalesPerDay />} />
            <Route path="orders-per-table" element={<OrdersPerTable />} />
            <Route path="orders-per-day" element={<OrdersPerDay />} />
            <Route path="item-sales" element={<ItemSales />} />
            <Route path="category-sales" element={<CategorySales />} />
            <Route path="payment-method" element={<PaymentMethodBreakdown />} />
            <Route path="hourly-heatmap" element={<HourlyHeatmap />} />
          </Route>

          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/order-logs" element={<OrdersHistory />} />
          <Route path="/admin/menu" element={<Menu />} />
          <Route path="/admin/add-menu" element={<AddMenu />} />
          <Route path="/menu-history" element={<MenuHistory />} />

          {/* Cashier */}
          <Route path="/cashier/tables" element={<Tables />} />
          <Route path="/cashier/orders" element={<Orders />} />

          {/* Kitchen */}
          <Route path="/kitchen/orders" element={<KitchenOrders />} />
        </Route>
      </Routes>

      <ToastContainer position="top-right" autoClose={2000} />
    </Router>
  );
}
