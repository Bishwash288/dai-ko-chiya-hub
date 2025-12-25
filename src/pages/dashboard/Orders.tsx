import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Order } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Flame, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const Orders = () => {
  const { orders, updateOrderStatus } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pending', class: 'status-pending', color: 'warning' };
      case 'started':
        return { icon: Flame, label: 'Preparing', class: 'status-started', color: 'accent' };
      case 'ready':
        return { icon: CheckCircle2, label: 'Ready', class: 'status-ready', color: 'success' };
      case 'cancelled':
        return { icon: XCircle, label: 'Cancelled', class: 'status-cancelled', color: 'destructive' };
      default:
        return { icon: Clock, label: 'Unknown', class: 'bg-muted', color: 'muted' };
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order ${orderId} marked as ${newStatus}`);
  };

  const stats = [
    { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'bg-warning' },
    { label: 'Preparing', value: orders.filter(o => o.status === 'started').length, color: 'bg-accent' },
    { label: 'Ready', value: orders.filter(o => o.status === 'ready').length, color: 'bg-success' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage incoming orders in real-time</p>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="started">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map(order => {
            const config = getStatusConfig(order.status);
            const StatusIcon = config.icon;
            const isExpanded = expandedOrder === order.id;

            return (
              <Card 
                key={order.id} 
                className={`overflow-hidden transition-all duration-200 ${
                  order.status === 'pending' ? 'border-warning/50' : ''
                }`}
              >
                <CardContent className="p-0">
                  {/* Order Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{order.id}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">Table {order.tableNumber}</Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={config.class}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        <span className="font-bold text-primary">Rs. {Math.round(order.totalAmount)}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border animate-fade-in">
                      <div className="pt-4 space-y-4">
                        {/* Order Items */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Order Items</h4>
                          <div className="space-y-2">
                            {order.items.map(item => (
                              <div key={item.id} className="flex justify-between text-sm bg-secondary/30 p-2 rounded">
                                <span className="text-foreground">{item.name} × {item.quantity}</span>
                                <span className="font-medium">
                                  Rs. {Math.round((item.discount ? item.price * (1 - item.discount / 100) : item.price) * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        {order.status !== 'cancelled' && order.status !== 'ready' && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {order.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm"
                                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(order.id, 'started');
                                  }}
                                >
                                  <Flame className="w-4 h-4 mr-1" />
                                  Start Preparing
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(order.id, 'cancelled');
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {order.status === 'started' && (
                              <Button 
                                size="sm"
                                className="bg-success hover:bg-success/90 text-success-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(order.id, 'ready');
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Mark Ready
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Orders;
