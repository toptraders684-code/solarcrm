-- Installation Details & Other Materials Migration

CREATE TABLE "installation_details" (
  "id" TEXT NOT NULL,
  "applicant_id" TEXT NOT NULL,
  -- A. Dispatch
  "dispatch_no" VARCHAR(100),
  "dispatch_date" DATE,
  "vehicle_no" VARCHAR(50),
  "driver_mobile_no" VARCHAR(15),
  -- B. Solar Panel
  "panel_brand" VARCHAR(100),
  "panel_cell_manufacturer" VARCHAR(100),
  "panel_type_of_module" VARCHAR(100),
  "panel_capacity_per_module" DECIMAL(10,3),
  "panel_qty" INTEGER,
  "panel_total_capacity_kw" DECIMAL(10,3),
  "panel_model_type" VARCHAR(100),
  "panel_serial_1" VARCHAR(100),
  "panel_serial_2" VARCHAR(100),
  "panel_serial_3" VARCHAR(100),
  "panel_serial_4" VARCHAR(100),
  "panel_serial_5" VARCHAR(100),
  "panel_serial_6" VARCHAR(100),
  -- C. Inverter
  "inverter_brand" VARCHAR(100),
  "inverter_capacity_kw" DECIMAL(10,3),
  "inverter_serial_no" VARCHAR(100),
  "inverter_qty" INTEGER,
  "inverter_model_no" VARCHAR(100),
  "inverter_input_voltage" VARCHAR(50),
  "inverter_output_voltage" VARCHAR(50),
  -- D. Structure
  "structure_gi_type" VARCHAR(50),
  "structure_leg_rafter" VARCHAR(50),
  "structure_perlin" VARCHAR(50),
  "structure_nut_bolt_clamp_box" VARCHAR(50),
  -- E. ACDB / DCDB
  "acdb_model" VARCHAR(100),
  "acdb_specs" VARCHAR(100),
  "acdb_brand" VARCHAR(100),
  "dcdb_model" VARCHAR(100),
  "dcdb_specs" VARCHAR(100),
  "dcdb_brand" VARCHAR(100),
  -- F. Earthing Kit
  "earthing_lightning_arrestor" VARCHAR(50),
  "earthing_chemical_bag" VARCHAR(50),
  "earthing_nut_bolt" VARCHAR(50),
  "earthing_pit_cover" VARCHAR(50),
  "earthing_rod" VARCHAR(50),
  -- G. PVC / Wires
  "wire_mc4_connector" VARCHAR(50),
  "wire_earthing_cable" VARCHAR(50),
  "wire_pvc_cable_tray" VARCHAR(50),
  "wire_pvc_conduit_pipe" VARCHAR(50),
  "wire_pvc_elbow" VARCHAR(50),
  "wire_c_clip" VARCHAR(50),
  "wire_t" VARCHAR(50),
  "wire_flexible_coil" VARCHAR(50),
  "wire_cable_tie" VARCHAR(50),
  "wire_black_tape" VARCHAR(50),
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "installation_details_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "installation_details_applicant_id_key" ON "installation_details"("applicant_id");

ALTER TABLE "installation_details"
  ADD CONSTRAINT "installation_details_applicant_id_fkey"
  FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "other_materials" (
  "id" TEXT NOT NULL,
  "applicant_id" TEXT NOT NULL,
  "item_no" INTEGER NOT NULL,
  "item" VARCHAR(200) NOT NULL,
  "size" VARCHAR(100),
  "length_qty" VARCHAR(100),
  "make" VARCHAR(100),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "other_materials_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "other_materials"
  ADD CONSTRAINT "other_materials_applicant_id_fkey"
  FOREIGN KEY ("applicant_id") REFERENCES "applicants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
