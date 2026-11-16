-- Copy B2 Rental's whole fleet into PUNSO (same database project). Safe to re-run.
-- ids become PS-…; a car that is "Rented" on B2 is set to "Available" here, because that rental
-- belongs to B2, not PUNSO. Cars PUNSO already has are updated (prices included). A car B2 no
-- longer has is removed from PUNSO too, unless a PUNSO booking still refers to it.
insert into public.punso_vehicles (id, data, sort_order)
select 'PS-' || substr(v.id, 4),
       jsonb_set(
         jsonb_set(v.data, '{id}', to_jsonb('PS-' || substr(v.id, 4))),
         '{status}', case when v.data->>'status' = 'Rented' then '"Available"'::jsonb else coalesce(v.data->'status', '"Available"'::jsonb) end
       ),
       v.sort_order
  from public.vehicles v
 where v.id like 'B2-%'
on conflict (id) do update set data = excluded.data, sort_order = excluded.sort_order;

delete from public.punso_vehicles p
 where not exists (select 1 from public.vehicles v where v.id like 'B2-%' and p.id = 'PS-' || substr(v.id, 4))
   and not exists (select 1 from public.punso_bookings b where b.vehicle_id = p.id);

select count(*) as punso_cars from public.punso_vehicles;
