const mongoose = require("mongoose");
const User = require("./models/user");
require("dotenv").config(); // if you use .env

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ email: "admin@example.com" });

    if (adminExists) {
      console.log("Admin already exists");
      process.exit();
    }

    const admin = new User({
      name: "Admin",
      email: "adminMeh@gmail.com",
      password: "admin123", // will hash automatically
      role: "admin",
    });

    await admin.save();

    console.log("Admin created successfully");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmin();