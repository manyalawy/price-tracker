-- Seed data for development/testing
-- Note: Run this after creating a test user via the app or Supabase dashboard

-- Insert sample products for the first user in profiles
-- Replace the user_id with an actual user UUID after signup
DO $$
DECLARE
  test_user_id uuid;
  product1_id uuid;
  product2_id uuid;
  product3_id uuid;
  i integer;
  base_price numeric;
BEGIN
  -- Get the first user
  SELECT id INTO test_user_id FROM public.profiles LIMIT 1;

  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Sign up first, then run this seed.';
    RETURN;
  END IF;

  -- Product 1: Amazon headphones
  product1_id := gen_random_uuid();
  INSERT INTO public.products (id, user_id, url, name, image_url, domain, current_price, target_price, currency, highest_price, lowest_price, last_checked_at, extraction_method)
  VALUES (product1_id, test_user_id, 'https://www.amazon.com/dp/B09WX4GJ7W', 'Sony WH-1000XM5 Wireless Headphones', null, 'amazon.com', 328.00, 279.99, 'USD', 399.99, 298.00, now(), 'adapter');

  -- Product 2: Walmart TV
  product2_id := gen_random_uuid();
  INSERT INTO public.products (id, user_id, url, name, image_url, domain, current_price, target_price, currency, highest_price, lowest_price, last_checked_at, extraction_method)
  VALUES (product2_id, test_user_id, 'https://www.walmart.com/ip/123456', 'Samsung 65" Crystal UHD 4K Smart TV', null, 'walmart.com', 547.99, 449.99, 'USD', 649.99, 498.00, now(), 'adapter');

  -- Product 3: Best Buy laptop
  product3_id := gen_random_uuid();
  INSERT INTO public.products (id, user_id, url, name, image_url, domain, current_price, target_price, currency, highest_price, lowest_price, last_checked_at, extraction_method)
  VALUES (product3_id, test_user_id, 'https://www.bestbuy.com/site/123456', 'MacBook Air 15" M3 256GB', null, 'bestbuy.com', 1249.99, 1099.99, 'USD', 1299.99, 1149.99, now(), 'adapter');

  -- Generate 30 days of price history for each product
  FOR i IN 0..29 LOOP
    -- Product 1: fluctuating around 320-350
    base_price := 335 + (random() * 30 - 15);
    INSERT INTO public.price_history (product_id, price, checked_at)
    VALUES (product1_id, round(base_price::numeric, 2), now() - (30 - i || ' days')::interval);

    -- Product 2: downward trend
    base_price := 600 - (i * 1.5) + (random() * 20 - 10);
    INSERT INTO public.price_history (product_id, price, checked_at)
    VALUES (product2_id, round(base_price::numeric, 2), now() - (30 - i || ' days')::interval);

    -- Product 3: stable with small dips
    base_price := 1250 + (random() * 50 - 25);
    IF i = 15 OR i = 22 THEN base_price := 1149.99; END IF;
    INSERT INTO public.price_history (product_id, price, checked_at)
    VALUES (product3_id, round(base_price::numeric, 2), now() - (30 - i || ' days')::interval);
  END LOOP;

END $$;
