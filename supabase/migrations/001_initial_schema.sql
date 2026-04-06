-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  expo_push_token text,
  email_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  name text not null,
  image_url text,
  domain text not null,
  current_price numeric not null,
  target_price numeric not null,
  currency text default 'USD',
  highest_price numeric,
  lowest_price numeric,
  last_checked_at timestamptz,
  is_active boolean default true,
  extraction_method text,
  extraction_selector text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Price history table
create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  price numeric not null,
  checked_at timestamptz default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('push', 'email')),
  sent_at timestamptz default now()
);

-- Indexes
create index if not exists idx_products_user_id on public.products(user_id);
create index if not exists idx_products_active on public.products(is_active) where is_active = true;
create index if not exists idx_price_history_product_id on public.price_history(product_id);
create index if not exists idx_price_history_checked_at on public.price_history(checked_at);
create index if not exists idx_notifications_product_id on public.notifications(product_id);
create index if not exists idx_notifications_sent_at on public.notifications(sent_at);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.price_history enable row level security;
alter table public.notifications enable row level security;

-- RLS Policies: profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- RLS Policies: products
create policy "Users can view own products"
  on public.products for select using (auth.uid() = user_id);
create policy "Users can insert own products"
  on public.products for insert with check (auth.uid() = user_id);
create policy "Users can update own products"
  on public.products for update using (auth.uid() = user_id);
create policy "Users can delete own products"
  on public.products for delete using (auth.uid() = user_id);

-- RLS Policies: price_history (read through product ownership)
create policy "Users can view own price history"
  on public.price_history for select
  using (exists (
    select 1 from public.products where products.id = price_history.product_id and products.user_id = auth.uid()
  ));

-- RLS Policies: notifications
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
