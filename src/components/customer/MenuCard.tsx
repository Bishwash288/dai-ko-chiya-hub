import { MenuItem } from '@/types';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Star, Sparkles } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
}

const MenuCard = ({ item }: MenuCardProps) => {
  const { addToCart } = useApp();

  const discountedPrice = item.discount 
    ? item.price * (1 - item.discount / 100) 
    : item.price;

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-warm transition-all duration-300 hover:-translate-y-1 border border-border/50">
      {/* Image/Icon Section */}
      <div className="relative h-32 bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
        {/* Category Icon */}
        <div className="text-5xl">
          {item.category === 'tea' && '🍵'}
          {item.category === 'snacks' && '🥟'}
          {item.category === 'extra' && '✨'}
        </div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.isBestSeller && (
            <Badge className="bg-accent text-accent-foreground text-xs px-2 py-0.5">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Best Seller
            </Badge>
          )}
          {item.isTodaysSpecial && (
            <Badge className="bg-success text-success-foreground text-xs px-2 py-0.5">
              <Sparkles className="w-3 h-3 mr-1" />
              Today's Special
            </Badge>
          )}
        </div>

        {item.discount && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
            -{item.discount}%
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-lg text-foreground mb-1 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
          {item.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg text-primary">
              Rs. {Math.round(discountedPrice)}
            </span>
            {item.discount && (
              <span className="text-sm text-muted-foreground line-through">
                Rs. {item.price}
              </span>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => addToCart(item)}
            disabled={!item.isAvailable}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-9 h-9 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {!item.isAvailable && (
          <p className="text-destructive text-xs mt-2 font-medium">Currently unavailable</p>
        )}
      </div>
    </div>
  );
};

export default MenuCard;
