import User from "../models/userModel.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import createToken from "../utils/createToken.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import UserActivity from "../models/userActivityTracker.js";

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new Error("Please fill all the inputs.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) res.status(400).send("User already exists");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = new User({ username, email, password: hashedPassword });

  try {
    await newUser.save();
    createToken(res, newUser._id);

    // Track account creation
    await UserActivity.create({
      userId: newUser._id,
      action: "account_created",
      isLoggedinUser: true,
    });

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    });
  } catch (error) {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log(email);
  console.log(password);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (isPasswordValid) {
      createToken(res, existingUser._id);

      res.status(201).json({
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        isAdmin: existingUser.isAdmin,
      });
      return;
    }
  }
});

const logoutCurrentUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httyOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found.");
  }
});

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);
      user.password = hashedPassword;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.isAdmin) {
      res.status(400);
      throw new Error("Cannot delete admin user");
    }

    await User.deleteOne({ _id: user._id });
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    throw new Error("User not found.");
  }
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const updateUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const storeUserActivity = asyncHandler(async (req, res) => {
  let { userId, productId, isLoggedinUser, action } = req.body;
  const validActions = ["buy", "viewed", "added_to_cart", "account_created"];

  if (!validActions.includes(action)) {
    res.status(400);
    throw new Error("Invalid action");
  }

  if (!isLoggedinUser) {
    userId = uuidv4();
    return res.status(200).json({ userId });
  }

  try {
    const existingActivity = await UserActivity.findOne({
      userId,
      productId,
      action,
    });

    if (existingActivity) {
      existingActivity.views =
        action === "viewed" ? (existingActivity.views || 0) + 1 : 0;
      existingActivity.purchases =
        action === "buy" ? (existingActivity.purchases || 0) + 1 : 0;
      existingActivity.cartAdds =
        action === "added_to_cart" ? (existingActivity.cartAdds || 0) + 1 : 0;
      existingActivity.timestamp = Date.now();
      await existingActivity.save();
      res.status(200).json(existingActivity);
    } else {
      const userActivity = new UserActivity({
        userId,
        productId,
        isLoggedinUser,
        action,
        clicks: action === "clicked" ? 1 : 0,
        views: action === "viewed" ? 1 : 0,
        purchases: action === "buy" ? 1 : 0,
        cartAdds: action === "added_to_cart" ? 1 : 0,
      });
      await userActivity.save();
      res.status(201).json({ message: "user activity stored" });
    }
  } catch (error) {
    res.status(400);
    console.log(error);
    throw new Error("Invalid data");
  }
});

const getLeadData = asyncHandler(async (req, res) => {
  try {
    const activities = await UserActivityTracker.find()
      .populate("userId", "username email") // Populate userId with specific fields
      .populate("productId", "name price category"); // Populate productId with specific fields

    return res.status(200).json(activities);
  } catch (error) {
    console.log(error);
    throw new Error("Invalid Data");
  }
});

export {
  createUser,
  loginUser,
  logoutCurrentUser,
  getAllUsers,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  deleteUserById,
  getUserById,
  updateUserById,
  storeUserActivity,
  getLeadData,
};
