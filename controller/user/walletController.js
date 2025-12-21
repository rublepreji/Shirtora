import {createWalletIfNotExists} from "../../services/userService/walletService.js"
import Wallet from "../../model/walletSchema.js";


async function debitWallet({ userId, amount, orderId }) {

  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.balance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= amount;
  await wallet.save();

  await WalletTransaction.create({
    userId,
    amount,
    type: "DEBIT",
    source: "WALLET_USAGE",
    orderId,
    description: "Used wallet balance for order"
  });
}


async function creditWallet({ userId, amount, source, orderId, description }) {

  const wallet = await createWalletIfNotExists(userId);

  wallet.balance += amount;
  await wallet.save();

  await WalletTransaction.create({
    userId,
    amount,
    type: "CREDIT",
    source,
    orderId,
    description
  });
}

async function loadWallet(req,res) {
    try {
        res.render('wallet')
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

export {
    loadWallet,
    creditWallet,
    debitWallet
}