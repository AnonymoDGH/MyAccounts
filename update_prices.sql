-- SQL Script to update the database schema and data for the new USD/EUR pricing

-- 1. Rename columns in the 'products' table
ALTER TABLE products RENAME COLUMN btc_price TO usd_price;
ALTER TABLE products RENAME COLUMN eth_price TO eur_price;

-- 2. Rename columns in the 'bundles' table
ALTER TABLE bundles RENAME COLUMN btc TO usd;
ALTER TABLE bundles RENAME COLUMN eth TO eur;

-- 3. Update the data in the 'products' table with the new prices
UPDATE products SET usd_price = '1.00', eur_price = '0.92' WHERE name = 'NETFLIX PREMIUM';
UPDATE products SET usd_price = '0.60', eur_price = '0.55' WHERE name = 'DISNEY+ ANNUAL';
UPDATE products SET usd_price = '0.30', eur_price = '0.28' WHERE name = 'CRUNCHYROLL MEGA';
UPDATE products SET usd_price = '2.90', eur_price = '2.65' WHERE name = 'DISCORD NITRO';
UPDATE products SET usd_price = '0.60', eur_price = '0.55' WHERE name = 'DISCORD NITRO BASIC';
UPDATE products SET usd_price = '2.90', eur_price = '2.65' WHERE name = 'DISCORD NITRO BOOST';
UPDATE products SET usd_price = '1.50', eur_price = '1.40' WHERE name = 'SPOTIFY PREMIUM';
UPDATE products SET usd_price = '1.20', eur_price = '1.10' WHERE name = 'HBO MAX';
UPDATE products SET usd_price = '0.80', eur_price = '0.75' WHERE name = 'AMAZON PRIME';
UPDATE products SET usd_price = '0.50', eur_price = '0.45' WHERE name = 'HULU NO ADS';

-- 4. Update the data in the 'bundles' table with the new prices
UPDATE bundles SET usd = '1.40', eur = '1.30' WHERE name = 'STREAMING STARTER';
UPDATE bundles SET usd = '3.00', eur = '2.80' WHERE name = 'ANIME & CHAT';
UPDATE bundles SET usd = '1.70', eur = '1.55' WHERE name = 'ULTIMATE FAMILY';
UPDATE bundles SET usd = '12.00', eur = '11.00' WHERE name = 'DISCORD BULK';
