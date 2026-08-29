import { Router } from "express";
import { saveTestDrive, listTestDrives, updateTestDriveStatus } from "../db.js";
import { STORE, shortId, nowIso } from "../lib/helpers.js";

const router = Router();

const VALID_STATUSES = ["Requested", "Confirmed", "Completed", "Cancelled"];

// Captive portal — "Pre-book a Test Drive" submission.
router.post("/api/testdrives", async (req, res) => {
  const body = req.body || {};

  const customerName = body.customerName || body.name || "Wi-Fi Guest";
  const customerPhone = body.customerPhone || body.phone || "";
  const customerEmail = body.customerEmail || body.email || "";
  const model = body.model || body.vehicle || "Not specified";
  const preferredDate = body.date || new Date().toISOString().slice(0, 10);
  const slot = body.slot || body.time || "Not specified";
  const storeLocation = body.storeLocation || STORE.name;

  const testDrive = {
    id: shortId("TD"),
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    vehicle_model: model,
    preferred_date: preferredDate,
    time_slot: slot,
    store_location: storeLocation,
    status: "Requested",
    booked_at: nowIso(),
  };

  await saveTestDrive(testDrive);

  res.json({ success: true, status: "ok", testDrive });
});

router.get("/api/testdrives", async (req, res) => {
  res.json({ success: true, testDrives: await listTestDrives() });
});

// Dashboard — Confirm / Mark Done / Cancel a booking.
router.patch("/api/testdrives/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  const testDrive = await updateTestDriveStatus(id, status);
  res.json({ success: true, testDrive });
});

export default router;
