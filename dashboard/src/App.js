import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Bell, Clock, CheckCircle, ChefHat, Package, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';

const OrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    totalRevenue: 0
  });
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for new orders
    newSocket.on('new_order', (order) => {
      setOrders(prev => [order, ...prev]);
      updateStats([order, ...orders]);
    });

    // Listen for order status updates
    newSocket.on('order_status_update', ({ id, status }) => {
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status } : order
      ));
    });

    // Listen for payment completions
    newSocket.on('payment_completed', ({ order_id }) => {
      setOrders(prev => prev.map(order => 
        order.id === order_id ? { ...order, payment_status: 'completed' } : order
      ));
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
      updateStats(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateStats = (orderList) => {
    const newStats = {
      pending: orderList.filter(o => o.status === 'pending').length,
      preparing: orderList.filter(o => o.status === 'preparing').length,
      ready: orderList.filter(o => o.status === 'ready').length,
      completed: orderList.filter(o => o.status === 'completed').length,
      totalRevenue: orderList
        .filter(o => o.payment_status === 'completed')
        .reduce((sum, o) => sum + o.total_amount, 0)
    };
    setStats(newStats);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      // Socket will handle the UI update
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-orange-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Burger Van Dashboard</h1>
              <p className="text-orange-100">Order Management System</p>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6" />
              <span className="bg-white text-orange-500 px-2 py-1 rounded-full text-sm font-bold">
                {stats.pending + stats.preparing + stats.ready}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Preparing</p>
                <p className="text-2xl font-bold text-orange-600">{stats.preparing}</p>
              </div>
              <ChefHat className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-blue-600">{formatPrice(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Active Orders</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {orders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>No orders yet</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-semibold text-gray-800">Order #{order.id.slice(-8)}</p>
                        <p className="text-sm text-gray-600">{order.customer_name || 'Anonymous'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      </span>
                      {order.payment_status === 'completed' ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending Payment
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{formatPrice(order.total_amount)}</p>
                      <p className="text-sm text-gray-600">{formatTime(order.created_at)}</p>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      {order.items.map((item, index) => (
                        <span key={index}>
                          {item.quantity}x {item.name}
                          {index < order.items.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'confirmed')}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                        >
                          Start Preparing
                        </button>
                      </>
                    )}
                    
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                      >
                        Start Preparing
                      </button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Mark Ready
                      </button>
                    )}
                    
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return <OrderDashboard />;
}

export default App;
