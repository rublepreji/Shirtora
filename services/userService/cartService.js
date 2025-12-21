import Product from "../../model/productSchema.js";
import Cart from "../../model/cartSchema.js";
import User from "../../model/userSchema.js";
import { STATUS } from "../../utils/statusCode.js";

async function addToCartService(userId, productId, variantIndex, quantity, finalPrice) {
  console.log("Inside the service");
  
  const product = await Product.findById(productId);
  if (!product) {
    return { success: false, status: STATUS.NOT_FOUND, message: "Product not found" };
  }

  if (product.isBlocked) {
    return { success: false, status: STATUS.NOT_FOUND, message: "This product is currently unavailable" };
  }

  const variant = product.variants[variantIndex];
  if (!variant) {
    return { success: false, status: STATUS.NOT_FOUND, message: "Invalid variant" };
  }

  const stock = variant.stock;
  const vIndex = Number(variantIndex);

  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
  }

  const existing = cart.items.find(
    item =>
      item.productId.toString() === productId &&
      item.variantIndex === vIndex
  );

  // If item already exists in cart
  if (existing) {
    if (existing.quantity + quantity > stock) {
      return { success: false, status: 400, message: `Only ${stock} available` };
    }

    if (existing.quantity >= 5) {
      return {
        success: false,
        status: 400,
        message: "You can only add up to 5 units of this product."
      };
    }

    existing.quantity += quantity;
    existing.pricePerUnit= finalPrice
    existing.totalPrice = existing.quantity * finalPrice;
  } else {
    if (quantity > stock) {
      return { success: false, status: 400, message: `Only ${stock} available` };
    }

    cart.items.push({
      productId,
      variantIndex: vIndex,
      quantity,
      pricePerUnit:finalPrice,
      totalPrice: quantity * finalPrice
    });
  }

  // Remove from wishlist automatically
  await User.updateOne(
    { _id: userId },
    { $pull: { wishlist: productId } }
  );

  await cart.save();

  return { success: true, status: STATUS.OK, message: "Product added to cart" };
}


 async function updateCartQtyService(userId, productId, variantIndex, qty) {
  
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return { success: false, message: "Cart not found" };
  }

  const item = cart.items.find(
    (i) => i.productId.toString() === productId && i.variantIndex == variantIndex
  );

  if (!item) {
    return { success: false, message: "Item not found in cart" };
  }

  const product = await Product.findById(productId);
  if (!product) {
    return { success: false, message: "Product not found" };
  }

  const stock = product.variants[variantIndex].stock;

  if (qty > stock) {
    return { success: false, message: `Only ${stock} items available` };
  }

  if (qty > 5) {
    return {
      success: false,
      message: "You can only add up to 5 units of this product."
    };
  }

  // Update quantity
  item.quantity = qty;
  item.totalPrice = qty * item.pricePerUnit;

  await cart.save();

  return { success: true };
}

async function removeCartService(userId,productId,variantIndex) {
    const cart = await Cart.findOne({ userId });
    const vIndex=Number(variantIndex)
    if(!cart){
        return {success:false,message:"cart not found"}
    }
    const itemExist= cart.items.some(it=>{
       return it.productId.toString()==productId && it.variantIndex==vIndex
    })
    if(!itemExist){
        return {success:false,message:"Item not found in cart"}
    }
    
    cart.items = cart.items.filter(it => {
      return !(it.productId.toString() === productId && it.variantIndex === vIndex);
    });

    await cart.save();
    return {success:true};
}

async function loadCartService(userId) {
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        populate: [
          { path: "category", select: "name isBlocked" },
          { path: "brand", select: "name isBlocked" }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!cart || cart.items.length === 0) {
      return  { 
        products: [], 
        grandTotal: 0
      };
    }

    const products = [];

    for (let item of cart.items) {
      const p = item.productId;
      if (!p) continue;

      const variant = p.variants[item.variantIndex];
      if (!variant) continue;

      const isBlocked =
        p.isBlocked === true ||
        p?.brand?.isBlocked === true ||
        p?.category?.isBlocked === true;

      if (isBlocked) continue;  

      const totalPrice = item.totalPrice;

      products.push({
        _id: item._id,
        productId: p._id,
        productName: p.productName,
        productImage: p.productImage,
        variantIndex: item.variantIndex,
        variant,
        quantity: item.quantity,
        pricePerUnit:item.pricePerUnit,
        totalPrice
      });
    }
    const grandTotal = products.reduce((sum, item) => sum + item.totalPrice, 0);
    return {products,grandTotal}
}




export default {
    addToCartService,
    updateCartQtyService,
    removeCartService,
    loadCartService
}


