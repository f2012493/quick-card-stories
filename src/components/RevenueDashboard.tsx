
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Eye, MousePointer, TrendingUp } from 'lucide-react';
import { adService } from '@/services/adService';

const RevenueDashboard = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [impressions, setImpressions] = useState(0);
  const [clickThroughRate, setClickThroughRate] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setTotalRevenue(adService.getTotalRevenue());
      setTodayRevenue(adService.getTodayRevenue());
      setImpressions(adService.getImpressionCount());
      setClickThroughRate(adService.getClickThroughRate());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-50 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-colors"
        title="Revenue Dashboard"
      >
        <DollarSign className="w-5 h-5" />
      </button>

      {/* Dashboard Modal */}
      {isVisible && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Ad Revenue Dashboard
                </span>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Revenue */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>

              {/* Today's Revenue */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Today's Revenue</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(todayRevenue)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <Eye className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Impressions</p>
                  <p className="text-lg font-semibold">{impressions.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <MousePointer className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">CTR</p>
                  <p className="text-lg font-semibold">{clickThroughRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* RPM (Revenue Per Mille) */}
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">RPM (Revenue per 1000 views)</p>
                <p className="text-lg font-semibold text-yellow-600">
                  {impressions > 0 ? formatCurrency((totalRevenue / impressions) * 1000) : '$0.00'}
                </p>
              </div>

              {/* Performance Badge */}
              <div className="text-center">
                <Badge variant={clickThroughRate > 2 ? "default" : "secondary"}>
                  {clickThroughRate > 2 ? "High Performance" : "Building Momentum"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default RevenueDashboard;
