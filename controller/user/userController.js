import dotenv from "dotenv";
import { STATUS } from "../../utils/statusCode.js";
import { logger } from "../../logger/logger.js";
import userService from "../../services/userService/userService.js";
import User from "../../model/userSchema.js";
import Wallet from "../../model/walletSchema.js";
import WalletTransaction from "../../model/transactionSchema.js";

dotenv.config();

async function productDetails(req, res) {
  try {
    const user = req.session.user ? req.session.user : "";
    const productId = req.params.id;
    const {
      userData,
      product,
      defaultVariant,
      totalOffer,
      categoryOffer,
      relatedProduct,
      isBlocked,
      isWishlist,
    } = await userService.productDetailsService(user, productId);

    if (!product || !defaultVariant) {
      return res.redirect("/pageNotFound");
    }

    const { offer, offerSource } = await userService.offerCalculation(product);

    res.render("productDetails", {
      user: userData,
      product,
      variants: product.variants,
      selectedVariant: defaultVariant,
      quantity: defaultVariant.stock,
      totalOffer: totalOffer,
      category: categoryOffer,
      relatedProduct,
      offer: offer,
      offerSource,
      isBlocked,
      isWishlist,
    });
  } catch (error) {
    return res.redirect("/pageNotFound");
  }
}

async function filterProduct(req, res) {
  try {
    const userQuery = {
      category: req.query.category ? req.query.category.split(",") : [],
      brand: req.query.brand ? req.query.brand.split(",") : [],
      price: req.query.price ? req.query.price.split(",") : [],
      sort: req.query.sort || "",
      page: parseInt(req.query.page) || 1,
      limit: 9,
      userId: req.session?.user?._id,
      search: req.query.search || "",
    };
    const result = await userService.filterProductService(userQuery);

    res.status(STATUS.OK).json({
      success: true,
      product: result.findProducts,
      totalPage: result.totalPage,
      currentPage: result.page,
    });
  } catch (error) {
    return res.redirect("/pageNotFound");
  }
}

async function viewProducts(req, res) {
  try {
    const user = req.session.user;
    const page = Number(req.query.page) || 1;

    const result = await userService.viewProductService(user?._id, page);

    res.render("viewProduct", {
      user: result.userData,
      products: result.product,
      totalProducts: result.totalProduct,
      totalPages: result.totalPages,
      category: result.categoryWithIds,
      brands: result.brand,
      currentPage: result.page,
    });
  } catch (error) {
    return res.redirect("/pageNotFound");
  }
}

async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destroy error", err);
        return res.redirect("/pageNotFound");
      }
    });
    return res.redirect("/signin");
  } catch (error) {
    console.log("Logout error", error);
    return res.redirect("/pageNotFound");
  }
}

async function signin(req, res) {
  try {
    const { email, password } = req.body;
    const result = await userService.signinService(email, password);
    if (!result.success) {
      return res.render("signinPage", { message: result.message });
    }
    req.session.user = result.findUser;
    return res.redirect("/");
  } catch (error) {
    logger.error("login error:", error);
    return res.render("signinPage", {
      message: "login failed, Please try again later",
    });
  }
}

async function resendOtp(req, res) {
  try {
    const { email } = req.session.userData;
    const result = await userService.resendOtpService(email);
    if (!result.success) {
      return res
        .status(STATUS.BAD_REQUEST)
        .json({ success: false, message: result.message });
    }
    req.session.userOtp = result.otp;
    return res.status(STATUS.OK).json({ message: result.message });
  } catch (error) {
    console.log("Error resending OTP");
    return res
      .status(STATUS.INTERNAL_SERVER_ERROR)
      .json({
        success: false,
        message: "Internal Server Error. Please try again",
      });
  }
}

async function verifyOtp(req, res) {
  try {
    console.log("hitting verifyotp");

    const { otp } = req.body;
    console.log(otp);
    console.log(req.session.userOtp);

    if (otp != req.session.userOtp) {
      return res.render("verifyOtp", { message: "Invalid OTP" });
    }

    const data = req.session.userData;

    let referrer = null;

    if (data.referralCode) {
      referrer = await User.findOne({ referralCode: data.referralCode.trim() });
    }

    const newUser = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.firstName+" "+data.lastName,
      email: data.email,
      phone: data.phone,
      password: data.hashedPassword,
      referredBy: referrer?._id || null,
    });

    newUser.referralCode =
      "REF" + newUser._id.toString().slice(-6).toUpperCase();
    await newUser.save();

    await Wallet.create({ userId: newUser._id, balance: 0 });

    if (referrer) {
      const REFERRER_REWARD = 100;
      const NEW_USER_REWARD = 50;

      await Wallet.updateOne(
        { userId: referrer._id },
        { $inc: { balance: REFERRER_REWARD } },
      );
      await Wallet.updateOne(
        { userId: newUser._id },
        { $inc: { balance: NEW_USER_REWARD } },
      );

      await WalletTransaction.create({
        userId: referrer._id,
        amount: REFERRER_REWARD,
        type: "CREDIT",
        source: "REFERRAL_SIGNUP",
      });

      await WalletTransaction.create({
        userId: newUser._id,
        amount: NEW_USER_REWARD,
        type: "CREDIT",
        source: "REFERRAL_SIGNUP",
      });
    }

    delete req.session.userOtp;
    delete req.session.userData;

    req.session.user = newUser;

    return res.json({ success: true, redirectUrl: "/signin" });
  } catch (error) {
    console.log("VERIFY OTP ERROR >>>", error);
    return res.redirect("/pageNotFound");
  }
}

const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      password,
      cPassword,
      referralCode,
    } = req.body;
    const result = await userService.signupService(password, cPassword, email);
    if (!result.success) {
      return res.render("signupPage", { message: result.message });
    }
    req.session.userOtp = result.otp;
    req.session.userData = {
      firstName,
      lastName,
      phone,
      email,
      hashedPassword: result.hashedPassword,
      referralCode,
    };
    return res.redirect("/verifyOtp");
  } catch (error) {
    logger.error("SignUp error", error);
    return res.redirect("/pageNotFound");
  }
};

const loadSignin = async (req, res) => {
  const user = req.user || req.session.user;
  if (user) {
    return res.redirect("/");
  }
  try {
    return res.render("signinPage");
  } catch (err) {
    console.log("signin page not loading ", err);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json("Server Error");
  }
};

const loadVerifyOtp = async (req, res) => {
  try {
    return res.render("verifyOtp");
  } catch (error) {
    console.log("Signup page not loading", error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json("Server Error");
  }
};

const loadSignup = async (req, res) => {
  try {
    return res.render("signupPage");
  } catch (err) {
    console.log("Signup page not loading", err);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json("Server Error");
  }
};

const pageNotFound = async (req, res) => {
  try {
    return res.render("pageNotFound");
  } catch (err) {
    console.log(err);
    return res
      .status(STATUS.INTERNAL_SERVER_ERROR)
      .json("Page not found: ", err);
  }
};

const loadHomePage = async (req, res) => {
  try {
    let userId = req.session.user?._id;
    const result = await userService.loadHomeService(userId);

    return res.render("homePage", {
      user: result.userData || undefined,
      newArrivals: result.newArrivals || [],
      flashSales: result.flashSales || [],
      bestSelling: result.bestSelling || []
    });
  } catch (error) {
    logger.error("Home page is not loading:", error);
    console.log("here the error is come form");

    return res.status(STATUS.INTERNAL_SERVER_ERROR).send("Server Error");
  }
};

const loadLandingPage = async (req, res) => {
  try {
    return res.render("landingPage");
  } catch (err) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json("some error: ", err);
  }
};

export {
  loadHomePage,
  loadLandingPage,
  pageNotFound,
  loadSignup,
  loadSignin,
  signup,
  verifyOtp,
  loadVerifyOtp,
  resendOtp,
  signin,
  logout,
  viewProducts,
  filterProduct,
  productDetails,
};
