import Cart from "../../model/cartSchema.js";
import User from "../../model/userSchema.js";
import Product from "../../model/productSchema.js";
import { STATUS } from "../../utils/statusCode.js";

async function addToCart(req, res) {
  try {    
    const userId = req.session.user._id;
    const { productId, variantIndex, qty } = req.body;

    const quantity = Number(qty);

    const product = await Product.findById(productId);
    if (!product) return res.status(STATUS.NOT_FOUND).json({ success: false, message: "Product not found" });

    if (product.isBlocked) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: "This product is currently unavailable"
      });
    }

    const variant = product.variants[variantIndex];
    if (!variant) return res.status(STATUS.BAD_REQUEST).json({ success: false, message: "Invalid variant" });

    const stock = variant.stock;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }
    const vIndex= Number(variantIndex)

    const existing = cart.items.find(
      item => item.productId.toString() === productId && item.variantIndex === vIndex
    );

    if (existing) {
      if (existing.quantity + quantity > stock ) {
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: `Only ${stock} available`
        });
      }
      else if(existing.quantity >=5){
        return res.status(STATUS.BAD_REQUEST).json({
          success: false,
          message: `You can only add up to 5 units of this product.`
        });
      }

      existing.quantity += quantity;
      existing.totalPrice = existing.quantity * variant.price;
    } else {
      if (quantity > stock) {
        return res.json({
          success: false,
          message: `Only ${stock} available`
        });
      }

      cart.items.push({
        productId,
        variantIndex,
        quantity,
        totalPrice: variant.price * quantity
      });
    }

    await User.updateOne(
      { _id: userId },
      { $pull: { wishlist: productId } }
    );

    await cart.save();
    return res.status(STATUS.OK).json({ success: true, message: "Product added to cart" });

  } catch (err) {
    console.log(err);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
  }
}


const updateCartQty = async (req, res) => {
    try {
        const { productId, variantIndex, qty } = req.body;
        const userId = req.session.user._id;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.json({ success: false, message: "Cart not found" });
        }

        const item = cart.items.find(
            (i) => i.productId.toString() === productId && i.variantIndex == variantIndex
        );

        if (!item) {
            return res.json({ success: false, message: "Item not found in cart" });
        }

        const product = await Product.findById(productId);
        const stock = product.variants[variantIndex].stock;

        if (qty > stock) {
            return res.json({
                success: false,
                message: `Only ${stock} items available`
            });
        }
        else if(qty > 5) {
            return res.json({
                success: false,
                message: `You can only add up to 5 units of this product.`
            });
        }
        

        item.quantity = qty;
        item.totalPrice = qty * product.variants[variantIndex].price;

        await cart.save();

        return res.json({ success: true });

    } catch (err) {
        console.log(err);
        return res.json({ success: false, message: "Server error" });
    }
};


async function removeFromCart(req, res) {
  try {
    const userId = req.session.user._id;
    const { productId, variantIndex } = req.body; 
    const cart = await Cart.findOne({ userId });
    const vIndex=Number(variantIndex)
    cart.items = cart.items.filter(it => {
      return !(it.productId.toString() === productId && it.variantIndex === vIndex);
    });
    await cart.save();
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: false });
  }
}


 async function loadCart(req, res) {
  try {
    const userId = req.session.user._id;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate:[{ path: "category" },{path:"brand"}]
    }).sort({createdAt:-1}).lean();

    if (!cart || cart.items.length === 0) {
      return res.render("cart", { products: [], user: req.session.user });
    }

      const products = cart.items.map(item => {
      const product = item.productId;
      const variant = product.variants[item.variantIndex];
      const totalPrice= variant.price * item.quantity
      const isBlocked =
        (product?.isBlocked === true) ||
        (product?.brand?.isBlocked === true) ||
        (product?.category?.isBlocked === true);


      return {
        _id: item._id,
        productId: product._id,
        productName: product.productName,
        productImage: product.productImage,
        variantIndex: item.variantIndex,
        variant: variant,      
        quantity: item.quantity,
        totalPrice: totalPrice,
        status: isBlocked
      };
    });

    return res.render("cart", {
      products,
      user: req.session.user
    });

  } catch (err) {
    console.log(err);
    res.redirect("/pageNotFound");
  }
}

export {loadCart, addToCart, removeFromCart, updateCartQty}