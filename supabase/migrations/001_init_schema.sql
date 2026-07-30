-- 1. PROFILES (User Roles)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'funcionario' CHECK (role IN ('admin', 'funcionario')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper: get the current user's role WITHOUT triggering RLS recursion.
-- SECURITY DEFINER bypasses RLS on profiles, so policies can call it safely.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Users can read their own profile; admins can read all.
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- 2. CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_read" ON categories
  FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON categories
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "categories_admin_update" ON categories
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "categories_admin_delete" ON categories
  FOR DELETE USING (public.is_admin());

-- 3. UNITS
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "units_read" ON units
  FOR SELECT USING (true);
CREATE POLICY "units_admin_write" ON units
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "units_admin_update" ON units
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "units_admin_delete" ON units
  FOR DELETE USING (public.is_admin());

-- 4. PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  entry_date DATE NOT NULL,
  expiration_date DATE,
  photo_url TEXT,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 10,
  current_quantity NUMERIC NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_read" ON products
  FOR SELECT USING (true);
CREATE POLICY "products_admin_insert" ON products
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "products_admin_update" ON products
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "products_admin_delete" ON products
  FOR DELETE USING (public.is_admin());

-- 5. PRODUCT_PRICING (Admin-only access — hides prices from employees)
CREATE TABLE product_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  cost_price NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE product_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_pricing_admin_read" ON product_pricing
  FOR SELECT USING (public.is_admin());
CREATE POLICY "product_pricing_admin_insert" ON product_pricing
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "product_pricing_admin_update" ON product_pricing
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "product_pricing_admin_delete" ON product_pricing
  FOR DELETE USING (public.is_admin());

-- 6. STOCK_MOVEMENTS
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_change NUMERIC NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'saída')),
  notes TEXT,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX stock_movements_recorded_at ON stock_movements(recorded_at);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_movements_read" ON stock_movements
  FOR SELECT USING (true);

-- Admin can record both entrada and saída.
CREATE POLICY "stock_movements_admin_insert" ON stock_movements
  FOR INSERT WITH CHECK (public.is_admin());

-- Employee can only record saída, and only under their own user id.
CREATE POLICY "stock_movements_employee_insert" ON stock_movements
  FOR INSERT WITH CHECK (
    auth.uid() = recorded_by
    AND movement_type = 'saída'
    AND public.get_my_role() = 'funcionario'
  );

-- 7. REVENUE CALCULATION FUNCTION
CREATE OR REPLACE FUNCTION calculate_revenue(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  faturamento_bruto NUMERIC,
  faturamento_liquido NUMERIC,
  total_quantidade_vendida NUMERIC,
  total_custo_vendido NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COALESCE(SUM(pp.sale_price * ABS(sm.quantity_change)), 0) AS faturamento_bruto,
    COALESCE(SUM((pp.sale_price - pp.cost_price) * ABS(sm.quantity_change)), 0) AS faturamento_liquido,
    COALESCE(SUM(ABS(sm.quantity_change)), 0) AS total_quantidade_vendida,
    COALESCE(SUM(pp.cost_price * ABS(sm.quantity_change)), 0) AS total_custo_vendido
  FROM stock_movements sm
  JOIN product_pricing pp ON sm.product_id = pp.product_id
  WHERE sm.movement_type = 'saída'
    AND sm.recorded_at::DATE >= start_date
    AND sm.recorded_at::DATE <= end_date;
$$;

-- 8. UPDATE PRODUCT QUANTITY TRIGGER
CREATE OR REPLACE FUNCTION update_product_quantity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET current_quantity = current_quantity + NEW.quantity_change
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_movements_update_quantity
  AFTER INSERT ON stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_product_quantity();

-- 9. NEW USER TRIGGER — auto-create a profile row when an auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, COALESCE(new.raw_app_meta_data->>'role', 'funcionario'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 10. STORAGE BUCKET FOR PRODUCT PHOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-photos');
CREATE POLICY "product_photos_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-photos' AND public.is_admin());
CREATE POLICY "product_photos_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-photos' AND public.is_admin());
