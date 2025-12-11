import Instructor from "../models/Instructor";

export async function addToDriverWallet(driverId: string, amount: number) {
  const driver = await Instructor.findById(driverId);
  if (!driver) throw new Error("Driver not found");

  driver.wallet = (driver.wallet || 0) + amount;
  await driver.save();
}
