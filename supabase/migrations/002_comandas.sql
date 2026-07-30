-- COMANDAS (bar tabs by customer name)
CREATE TABLE comandas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada')),
  opened_by UUID NOT NULL REFERENCES profiles(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
CREATE POLICY comandas_read ON comandas FOR SELECT USING (true);
CREATE POLICY comandas_insert ON comandas FOR INSERT WITH CHECK (auth.uid() = opened_by);
CREATE POLICY comandas_update ON comandas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY comandas_delete ON comandas FOR DELETE USING (public.is_admin());

-- COMANDA ITEMS (each line snapshots the sale price so employees see the total
-- to charge WITHOUT reading the admin-only product_pricing table).
CREATE TABLE comanda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comanda_id UUID NOT NULL REFERENCES comandas(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit_sale_price NUMERIC NOT NULL DEFAULT 0,
  movement_id UUID,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX comanda_items_comanda_id ON comanda_items(comanda_id);
ALTER TABLE comanda_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY comanda_items_read ON comanda_items FOR SELECT USING (true);

-- Add an item: checks stock, records the saída movement (deducts stock now) and
-- snapshots the sale price. SECURITY DEFINER so it can touch pricing/movements
-- regardless of the caller's role, with explicit checks inside.
CREATE OR REPLACE FUNCTION comanda_add_item(p_comanda_id UUID, p_product_id UUID, p_quantity NUMERIC)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_status TEXT; v_name TEXT; v_stock NUMERIC; v_price NUMERIC; v_mov UUID; v_item UUID;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'nao autenticado'; END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN RAISE EXCEPTION 'quantidade invalida'; END IF;
  SELECT status, customer_name INTO v_status, v_name FROM comandas WHERE id = p_comanda_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'comanda nao encontrada'; END IF;
  IF v_status <> 'aberta' THEN RAISE EXCEPTION 'comanda ja fechada'; END IF;
  SELECT current_quantity INTO v_stock FROM products WHERE id = p_product_id FOR UPDATE;
  IF v_stock IS NULL THEN RAISE EXCEPTION 'produto nao encontrado'; END IF;
  IF v_stock < p_quantity THEN RAISE EXCEPTION 'estoque insuficiente (disponivel %)', v_stock; END IF;
  SELECT sale_price INTO v_price FROM product_pricing WHERE product_id = p_product_id;
  v_price := COALESCE(v_price, 0);
  INSERT INTO stock_movements(product_id, quantity_change, movement_type, notes, recorded_by)
    VALUES (p_product_id, -p_quantity, 'saída', 'Comanda: ' || v_name, v_uid)
    RETURNING id INTO v_mov;
  INSERT INTO comanda_items(comanda_id, product_id, quantity, unit_sale_price, movement_id, created_by)
    VALUES (p_comanda_id, p_product_id, p_quantity, v_price, v_mov, v_uid)
    RETURNING id INTO v_item;
  RETURN v_item;
END; $$;

-- Remove an item: restores stock and drops the linked movement.
CREATE OR REPLACE FUNCTION comanda_remove_item(p_item_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_status TEXT; v_comanda UUID; v_product UUID; v_qty NUMERIC; v_mov UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'nao autenticado'; END IF;
  SELECT comanda_id, product_id, quantity, movement_id
    INTO v_comanda, v_product, v_qty, v_mov FROM comanda_items WHERE id = p_item_id;
  IF v_comanda IS NULL THEN RAISE EXCEPTION 'item nao encontrado'; END IF;
  SELECT status INTO v_status FROM comandas WHERE id = v_comanda;
  IF v_status <> 'aberta' THEN RAISE EXCEPTION 'comanda ja fechada'; END IF;
  UPDATE products SET current_quantity = current_quantity + v_qty WHERE id = v_product;
  IF v_mov IS NOT NULL THEN DELETE FROM stock_movements WHERE id = v_mov; END IF;
  DELETE FROM comanda_items WHERE id = p_item_id;
END; $$;

-- Cancel a comanda: reverses all its items and deletes it.
CREATE OR REPLACE FUNCTION comanda_cancel(p_comanda_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'nao autenticado'; END IF;
  SELECT status INTO v_status FROM comandas WHERE id = p_comanda_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'comanda nao encontrada'; END IF;
  IF v_status <> 'aberta' THEN RAISE EXCEPTION 'comanda ja fechada'; END IF;
  FOR r IN SELECT product_id, quantity, movement_id FROM comanda_items WHERE comanda_id = p_comanda_id LOOP
    UPDATE products SET current_quantity = current_quantity + r.quantity WHERE id = r.product_id;
    IF r.movement_id IS NOT NULL THEN DELETE FROM stock_movements WHERE id = r.movement_id; END IF;
  END LOOP;
  DELETE FROM comandas WHERE id = p_comanda_id;
END; $$;

GRANT EXECUTE ON FUNCTION comanda_add_item(UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION comanda_remove_item(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION comanda_cancel(UUID) TO authenticated;
