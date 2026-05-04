import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, ArrowLeft } from 'lucide-react';

const OrderConfirmation = () => {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600">Thank you for your order</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order ID:</p>
            <p className="font-mono text-lg font-semibold text-gray-800">{orderId}</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              <span>Estimated preparation time: 15-20 minutes</span>
            </div>
            <p className="text-sm text-gray-500">
              We'll notify you when your order is ready for collection.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/"
              className="block w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              <ArrowLeft className="inline w-4 h-4 mr-2" />
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
