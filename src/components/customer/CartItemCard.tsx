import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X } from 'lucide-react';

interface CartItemCardProps {
  item: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    discount?: number;
  };
}

const CartItemCard = ({ item }: CartItemCardProps) => {
  const { updateQuantity, removeFromCart } = useApp();

  const discountedPrice = item.discount 
    ? item.price * (1 - item.discount / 100) 
    : item.price;

  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-foreground truncate">{item.name}</h4>
        <p className="text-primary font-semibold text-sm">
          Rs. {Math.round(discountedPrice)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="w-7 h-7 rounded-full"
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
        >
          <Minus className="w-3 h-3" />
        </Button>
        
        <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
        
        <Button
          variant="outline"
          size="icon"
          className="w-7 h-7 rounded-full"
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
        >
          <Plus className="w-3 h-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => removeFromCart(item.id)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default CartItemCard;
