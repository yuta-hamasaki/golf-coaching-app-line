-- Allow cancelled bookings to release their availability slot so the slot can be reused.
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_availability_slot_id_fkey";
ALTER TABLE "bookings" ALTER COLUMN "availability_slot_id" DROP NOT NULL;
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_availability_slot_id_fkey"
  FOREIGN KEY ("availability_slot_id") REFERENCES "availability_slots"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
