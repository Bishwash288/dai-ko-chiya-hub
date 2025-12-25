import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock, Flame, CheckCircle2, XCircle } from 'lucide-react';

interface OrderStatusCardProps {
  order: Order;
}

const OrderStatusCard = ({ order }: OrderStatusCardProps) => {
  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          color: 'status-pending',
          description: 'Your order is being reviewed',
          step: 1,
        };
      case 'started':
        return {
          icon: Flame,
          label: 'Preparing',
          color: 'status-started',
          description: 'Your order is being prepared',
          step: 2,
        };
      case 'ready':
        return {
          icon: CheckCircle2,
          label: 'Ready',
          color: 'status-ready',
          description: 'Your order is ready for pickup!',
          step: 3,
        };
      case 'cancelled':
        return {
          icon: XCircle,
          label: 'Cancelled',
          color: 'status-cancelled',
          description: 'Order has been cancelled',
          step: 0,
        };
      default:
        return {
          icon: Clock,
          label: 'Unknown',
          color: 'bg-muted',
          description: '',
          step: 0,
        };
    }
  };

  const config = getStatusConfig(order.status);
  const StatusIcon = config.icon;

  const steps = [
    { label: 'Pending', step: 1 },
    { label: 'Preparing', step: 2 },
    { label: 'Ready', step: 3 },
  ];

  return (
    <div className="bg-card rounded-xl p-6 shadow-md border border-border/50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Order ID</p>
          <p className="font-display font-bold text-xl text-foreground">{order.id}</p>
        </div>
        <Badge className={`${config.color} px-3 py-1`}>
          <StatusIcon className="w-4 h-4 mr-1" />
          {config.label}
        </Badge>
      </div>

      {/* Progress Steps */}
      {order.status !== 'cancelled' && (
        <div className="mb-6">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            <div 
              className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
              style={{ 
                width: `${((config.step - 1) / 2) * 100}%` 
              }}
            />

            {steps.map((step, idx) => (
              <div key={step.label} className="relative z-10 flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    step.step <= config.step 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.step}
                </div>
                <span className="text-xs mt-2 text-muted-foreground">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Description */}
      <div className={`text-center py-4 rounded-lg ${config.color}`}>
        <StatusIcon className="w-8 h-8 mx-auto mb-2" />
        <p className="font-medium">{config.description}</p>
      </div>

      {/* Order Items */}
      <div className="mt-6">
        <h4 className="font-medium text-foreground mb-3">Order Items</h4>
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.name} × {item.quantity}
              </span>
              <span className="font-medium text-foreground">
                Rs. {Math.round((item.discount ? item.price * (1 - item.discount / 100) : item.price) * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-3 pt-3 flex justify-between">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold text-primary text-lg">Rs. {Math.round(order.totalAmount)}</span>
        </div>
      </div>

      {/* Table Number */}
      <div className="mt-4 text-center">
        <Badge variant="outline" className="text-sm">
          Table {order.tableNumber}
        </Badge>
      </div>
    </div>
  );
};

export default OrderStatusCard;
