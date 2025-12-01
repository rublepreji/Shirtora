async function generateOrderId() {
  const datePart = new Date().toISOString().slice(0,10).replace(/-/g, "");

  const lastOrder = await Order.findOne().sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastOrder) {
    const lastNumber = parseInt(lastOrder.orderId.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  const formattedNumber = String(nextNumber).padStart(6, "0");

  return `ORD-${datePart}-${formattedNumber}`;
}
export {generateOrderId}