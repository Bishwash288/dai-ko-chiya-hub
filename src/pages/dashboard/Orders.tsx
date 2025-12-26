import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Flame, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Timer,
  Loader2,
  Users,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

const Orders = () => {
  const { orders, updateOrderStatus, loadingOrders, shopSettings } = useApp();
  const [filter, setFilter] = useState<string>('active');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');

  // Group orders by table
  const ordersByTable = useMemo(() => {
    const grouped: Record<number, Order[]> = {};
    orders.forEach(order => {
      if (!grouped[order.tableNumber]) {
        grouped[order.tableNumber] = [];
      }
      grouped[order.tableNumber].push(order);
    });
    // Sort each table's orders by creation time (newest first)
    Object.keys(grouped).forEach(table => {
      grouped[Number(table)].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    return grouped;
  }, [orders]);

  // Get active tables (tables with pending/preparing orders)
  const activeTables = useMemo(() => {
    return Object.entries(ordersByTable)
      .filter(([_, tableOrders]) => 
        tableOrders.some(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'started')
      )
      .map(([table]) => Number(table))
      .sort((a, b) => a - b);
  }, [ordersByTable]);

  const filteredOrders = useMemo(() => {
    switch (filter) {
      case 'active':
        return orders.filter(o => 
          o.status === 'pending' || o.status === 'preparing' || o.status === 'started'
        );
      case 'pending':
        return orders.filter(o => o.status === 'pending');
      case 'preparing':
        return orders.filter(o => o.status === 'started' || o.status === 'preparing');
      case 'ready':
        return orders.filter(o => o.status === 'ready');
      case 'cancelled':
        return orders.filter(o => o.status === 'cancelled');
      default:
        return orders;
    }
  }, [orders, filter]);

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pending', class: 'bg-warning text-warning-foreground', color: 'warning' };
      case 'started':
      case 'preparing':
        return { icon: Flame, label: 'Preparing', class: 'bg-accent text-accent-foreground', color: 'accent' };
      case 'ready':
        return { icon: CheckCircle2, label: 'Ready', class: 'bg-success text-success-foreground', color: 'success' };
      case 'cancelled':
        return { icon: XCircle, label: 'Cancelled', class: 'bg-destructive text-destructive-foreground', color: 'destructive' };
      default:
        return { icon: Clock, label: 'Unknown', class: 'bg-muted', color: 'muted' };
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingOrder(orderId);
    await updateOrderStatus(orderId, newStatus);
    toast.success(`Order marked as ${newStatus}`);
    setUpdatingOrder(null);
  };

  const stats = [
    { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: 'bg-warning', icon: Clock },
    { label: 'Preparing', value: orders.filter(o => o.status === 'started' || o.status === 'preparing').length, color: 'bg-accent', icon: Flame },
    { label: 'Ready', value: orders.filter(o => o.status === 'ready').length, color: 'bg-success', icon: CheckCircle2 },
    { label: 'Active Tables', value: activeTables.length, color: 'bg-primary', icon: Users },
  ];

  if (loadingOrders) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderOrderCard = (order: Order, showTable = true) => {
    const config = getStatusConfig(order.status);
    const StatusIcon = config.icon;
    const isExpanded = expandedOrder === order.id;
    const isUpdating = updatingOrder === order.id;
    const isPreparing = order.status === 'started' || order.status === 'preparing';

    return (
      <Card 
        key={order.id} 
        className={`overflow-hidden transition-all duration-200 ${
          order.status === 'pending' ? 'border-warning/50 ring-2 ring-warning/20' : ''
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
                  <div className="flex items-center gap-2">
                    {showTable && (
                      <Badge variant="outline" className="font-bold text-base">
                        Table {order.tableNumber}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      #{order.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(order.createdAt), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={config.class}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
                <span className="font-bold text-primary text-lg">Rs. {Math.round(order.totalAmount)}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* Quick preview of items */}
            {!isExpanded && (
              <div className="mt-2 flex flex-wrap gap-1">
                {order.items.slice(0, 3).map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {item.name} ×{item.quantity}
                  </Badge>
                ))}
                {order.items.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{order.items.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="px-4 pb-4 border-t border-border animate-fade-in">
              <div className="pt-4 space-y-4">
                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-secondary/30 p-2 rounded">
                        <span className="text-foreground">{item.name} × {item.quantity}</span>
                        <span className="font-medium">
                          Rs. {Math.round(item.price * item.quantity)}
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
                          disabled={isUpdating}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, 'started');
                          }}
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Flame className="w-4 h-4 mr-1" />}
                          Start Preparing
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          disabled={isUpdating}
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
                    {isPreparing && (
                      <Button 
                        size="sm"
                        className="bg-success hover:bg-success/90 text-success-foreground"
                        disabled={isUpdating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(order.id, 'ready');
                        }}
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
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
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage incoming orders in real-time</p>
        </div>

        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'table')}>
            <TabsList>
              <TabsTrigger value="table">By Table</TabsTrigger>
              <TabsTrigger value="list">All Orders</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => {
          const StatIcon = stat.icon;
          return (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <StatIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Mode: By Table */}
      {viewMode === 'table' ? (
        <div className="space-y-6">
          {activeTables.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active orders</p>
              </CardContent>
            </Card>
          ) : (
            activeTables.map(tableNum => {
              const tableOrders = ordersByTable[tableNum].filter(o => 
                o.status === 'pending' || o.status === 'preparing' || o.status === 'started'
              );
              const totalAmount = tableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
              const hasNewItems = tableOrders.some(o => o.status === 'pending');

              return (
                <Card key={tableNum} className={`overflow-hidden ${hasNewItems ? 'ring-2 ring-warning' : ''}`}>
                  <CardHeader className="bg-secondary/30 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-xl font-bold text-primary-foreground">{tableNum}</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">Table {tableNum}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {tableOrders.length} active order{tableOrders.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-primary">Rs. {Math.round(totalAmount)}</p>
                      </div>
                    </div>
                    {hasNewItems && (
                      <Badge className="bg-warning text-warning-foreground w-fit mt-2">
                        <Plus className="w-3 h-3 mr-1" />
                        New items pending
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {tableOrders.map(order => renderOrderCard(order, false))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        /* View Mode: All Orders List */
        <div className="space-y-4">
          <div className="flex justify-end">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Orders</SelectItem>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No orders found</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map(order => renderOrderCard(order))
          )}
        </div>
      )}
    </div>
  );
};

export default Orders;