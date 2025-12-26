-- 1. Create shops table for multi-shop support
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Shop',
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  number_of_tables INTEGER NOT NULL DEFAULT 10,
  is_open BOOLEAN NOT NULL DEFAULT true,
  sound_alerts BOOLEAN NOT NULL DEFAULT true,
  browser_notifications BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS on shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- 3. Add shop_id to menu_items
ALTER TABLE public.menu_items ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;

-- 4. Add shop_id to orders
ALTER TABLE public.orders ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;

-- 5. Add shop_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE;

-- 6. Create storage bucket for shop logos
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-logos', 'shop-logos', true);

-- 7. Storage policies for shop-logos bucket
CREATE POLICY "Shop logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-logos');

CREATE POLICY "Authenticated users can upload shop logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-logos');

CREATE POLICY "Authenticated users can update shop logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-logos');

CREATE POLICY "Authenticated users can delete shop logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shop-logos');

-- 8. RLS policies for shops table
CREATE POLICY "Shops are publicly readable"
ON public.shops FOR SELECT
USING (true);

CREATE POLICY "Admins can insert their own shop"
ON public.shops FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update their own shop"
ON public.shops FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.shop_id = shops.id 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete their own shop"
ON public.shops FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.shop_id = shops.id 
    AND user_roles.role = 'admin'
  )
);

-- 9. Update menu_items RLS to include shop isolation
DROP POLICY IF EXISTS "Admins can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Admins can delete menu items" ON public.menu_items;

CREATE POLICY "Admins can insert menu items for their shop"
ON public.menu_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.shop_id = menu_items.shop_id 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update menu items for their shop"
ON public.menu_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.shop_id = menu_items.shop_id 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete menu items for their shop"
ON public.menu_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.shop_id = menu_items.shop_id 
    AND user_roles.role = 'admin'
  )
);

-- 10. Update orders RLS to include shop isolation
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

CREATE POLICY "Admins can update orders for their shop"
ON public.orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.shop_id = orders.shop_id 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete orders for their shop"
ON public.orders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.shop_id = orders.shop_id 
    AND user_roles.role = 'admin'
  )
);

-- 11. Create trigger for shops updated_at
CREATE TRIGGER update_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Enable realtime for shops
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;