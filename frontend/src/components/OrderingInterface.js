import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, X, CreditCard, User, Phone, Mail } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OrderingInterface = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [processingOrder, setProcessingOrder] = useState(false);
  
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupItemsByCategory = () => {
    const grouped = {};
    menuItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please provide your name and phone number');
      return;
    }

    setProcessingOrder(true);
    
    try {
      const orderData = {
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        items: items.map(item => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await axios.post('/api/orders', orderData);
      
      // Process payment (mock)
      await axios.post('/api/payments', {
        order_id: response.data.id,
        payment_method: 'card'
      });

      clearCart();
      setCustomerInfo({ name: '', email: '', phone: '' });
      setShowCheckout(false);
      setShowCart(false);
      
      navigate(`/confirmation/${response.data.id}`);
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    } finally {
      setProcessingOrder(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByCategory();
  const categories = Object.keys(groupedItems);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-500 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Burger Van</h1>
              <p className="text-orange-100">Fresh burgers, fast service!</p>
            </div>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-white text-orange-500 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              <ShoppingCart className="inline-block w-5 h-5 mr-2" />
              Cart ({getTotalItems()})
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Our Menu</h2>
            
            {categories.map(category => (
              <div key={category} className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 capitalize">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedItems[category].map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-gray-800">{item.name}</h4>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        </div>
                        <span className="text-orange-500 font-bold text-lg ml-4">
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => addItem(item)}
                        className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart Sidebar */}
          <div className={`lg:col-span-1 ${showCart ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-lg p-6 h-full lg:h-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Your Cart</h3>
                {showCart && (
                  <button
                    onClick={() => setShowCart(false)}
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-gray-500 text-xs">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-lg">Total:</span>
                      <span className="font-bold text-xl text-orange-500">{formatPrice(getTotalPrice())}</span>
                    </div>
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Checkout</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline w-4 h-4 mr-1" />
                  Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="your@email.com"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg text-orange-500">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={processingOrder}
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50"
              >
                {processingOrder ? 'Processing...' : 'Complete Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderingInterface;
