-- Title: Add Device Battery Percent
-- Description: Store device fuel-gauge battery percentage separately from voltage
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS battery_percent NUMERIC;

COMMENT ON COLUMN devices.battery_percent IS 'Battery state of charge percentage reported by the device fuel gauge';
