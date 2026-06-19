-- Admin
INSERT INTO "Admin" ("username", "password", "role") VALUES
('fghjkl', '$2a$10$' || gen_random_uuid() || 'fghjkl123', 'admin'),
('jotta', '$2a$10$' || gen_random_uuid() || 'jotta1@', 'admin')
ON CONFLICT ("username") DO NOTHING;

-- Settings
INSERT INTO "Setting" ("key", "value") VALUES
('store_name', 'StreamCartoon')
ON CONFLICT ("key") DO NOTHING;

-- Categories
INSERT INTO "Category" ("name", "icon", "active", "order") VALUES
('🎬 Netflix', '🎬', true, 1),
('📺 Disney+', '📺', true, 2),
('🎥 HBO', '🎥', true, 3),
('🎵 Spotify', '🎵', true, 4),
('📦 Amazon', '📦', true, 5)
ON CONFLICT ("name") DO NOTHING;

-- Products
INSERT INTO "Product" ("name", "description", "price", "category", "image", "active", "stock", "deliveryType") VALUES
('Netflix 1 Mês', 'Assinatura Netflix Premium 1 mês. Conta compartilhada, tela HD/4K.', 19.90, '🎬 Netflix', '/netflix.svg', true, 100, 'auto'),
('Netflix 3 Meses', 'Assinatura Netflix Premium 3 meses. Economia e praticidade!', 49.90, '🎬 Netflix', '/netflix.svg', true, 100, 'auto'),
('Disney+ 1 Mês', 'Assinatura Disney+ 1 mês. Todos os filmes e séries da Marvel, Star Wars e mais!', 14.90, '📺 Disney+', '/disney.svg', true, 100, 'auto'),
('Disney+ 3 Meses', 'Assinatura Disney+ 3 meses. O melhor custo-benefício!', 39.90, '📺 Disney+', '/disney.svg', true, 100, 'auto'),
('HBO Max 1 Mês', 'Assinatura HBO Max 1 mês. Séries, filmes e lançamentos exclusivos.', 12.90, '🎥 HBO', '/hbomax.svg', true, 100, 'auto'),
('Spotify Premium 1 Mês', 'Spotify Premium 1 mês. Música sem anúncios, offline e ilimitada.', 9.90, '🎵 Spotify', '/spotify.svg', true, 100, 'auto'),
('Amazon Prime 1 Mês', 'Amazon Prime 1 mês. Frete grátis, Prime Video, Prime Music e mais!', 8.90, '📦 Amazon', '/prime.svg', true, 100, 'auto');

-- Codes (assumes products have IDs 1-7)
INSERT INTO "Code" ("productId", "value") 
SELECT id, 'NF1M-A1B2C3' FROM "Product" WHERE name = 'Netflix 1 Mês'
UNION ALL
SELECT id, 'NF1M-D4E5F6' FROM "Product" WHERE name = 'Netflix 1 Mês'
UNION ALL
SELECT id, 'NF1M-G7H8I9' FROM "Product" WHERE name = 'Netflix 1 Mês'
UNION ALL
SELECT id, 'DP1M-J1K2L3' FROM "Product" WHERE name = 'Disney+ 1 Mês'
UNION ALL
SELECT id, 'DP1M-M4N5O6' FROM "Product" WHERE name = 'Disney+ 1 Mês'
UNION ALL
SELECT id, 'DP1M-P7Q8R9' FROM "Product" WHERE name = 'Disney+ 1 Mês';
