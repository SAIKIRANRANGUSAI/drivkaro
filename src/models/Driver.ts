import mongoose, { Schema } from "mongoose";

const BookingSchema = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true }, // the account who initiated booking
    otherUserId: { type: mongoose.Types.ObjectId, ref: "OtherUser", default: null }, // optional
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, default: null },
    carType: { type: String, enum: ["hatchback", "sedan", "suv"], required: true },
    driverPreference: { type: String, enum: ["male", "female", "any"], default: "any" },
    dates: [{ type: Date }], // array of session dates
    timeSlots: [{ type: String }], // array of time strings for each date
    totalDays: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    status: { type: String, enum: ["requested","assigned","ongoing","completed","cancelled"], default: "requested" },
    assignedDriverId: { type: mongoose.Types.ObjectId, ref: "Driver", default: null },
    startOtp: { type: String, default: "" },
    endOtp: { type: String, default: "" },
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1 });
BookingSchema.index({ otherUserId: 1 });
BookingSchema.index({ status: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
