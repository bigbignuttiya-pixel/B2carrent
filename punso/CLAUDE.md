# PUNSO Car Rental — working rules

**All prices and vehicle data follow B2 Rental (the B2carrent project in the repo root). B2 is the
source of truth; PUNSO copies it.**

- Fleet: the same cars as B2 — same count, models, plate numbers, prices per day, deposits, specs,
  features, photos and display order. Only the id prefix differs (`B2-…` → `PS-…`).
- Add-on prices (`punso_addon_prices`) match B2's `addon_prices`. Coupons match B2's coupons
  (B2's `B2DRIVE2026` is `PUNSO2026` here).
- A car "Rented" on B2 is "Available" in PUNSO (that rental belongs to B2's customer).
- Never set a PUNSO price or vehicle detail by hand that differs from B2. When B2 changes (new
  car, removed car, new price, new photo), bring PUNSO back in line:
  1. Live database: run `supabase/sync-fleet-from-b2.sql` in the shared Supabase project
     (fxnvwjugcapmyybvgymv). It upserts every B2 car and removes cars B2 dropped (unless a PUNSO
     booking still uses them).
  2. Photos: copy any new file from `public/vehicles/` into `punso/public/vehicles/`. If the photo
     shows a "B2 RENTAL" plate, replace it with the black/yellow "PUNSO RENTAL" plate first.
  3. Code: refresh `INITIAL_VEHICLES` in `src/data.js` from B2's live `vehicles` table, then
     `node scripts/make-seed.mjs` and rebuild `supabase/setup.sql`.
  4. Check: B2 and PUNSO car counts are equal and every car's details/price compare equal.

## Separation from B2
- PUNSO's database objects are all prefixed `punso_` (tables, functions, buckets `punso-…`,
  policies "punso …"). Never write to B2's tables (`vehicles`, `bookings`, …) from PUNSO work.
- Work only inside `punso/` for PUNSO changes; B2's site in the repo root must not change.
- Live site: https://b2carrent-i2ow.vercel.app (Vercel project with Root Directory `punso`).
