const mongoose = require("mongoose");
const { Schema } = mongoose;

const BookingSchema = new Schema(
  {
    tripType: {
      type: String,
      enum: ["outstation-oneway", "outstation-round", "local", "airport"],
      required: true,
    },
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    pickupAddress: { type: String, required: true, trim: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // ISO date string (yyyy-mm-dd)
    cabTypeId: { type: String, required: true },
    distanceKm: { type: Number, min: 0 },
    estimatedFare: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["pending_confirmation", "confirmed", "cancelled", "completed"],
      default: "pending_confirmation",
    },
    // The rider's FCM device token, captured at booking time — lets the
    // admin's status-change actions (confirm/cancel/complete) push a
    // notification straight to the phone that made the booking. Optional:
    // older bookings and web bookings won't have one, and that's fine.
    deviceToken: { type: String },
  },
  { timestamps: true }
);

// Compound index for the two access patterns that matter under load:
// 1. "show me bookings for this route around this date" (dispatcher/search view)
// 2. "show me this rider's/city's most recent bookings" (status feed, newest first)
BookingSchema.index({ from: 1, to: 1, date: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });
BookingSchema.index({ mobileNumber: 1, createdAt: -1 });

module.exports = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
