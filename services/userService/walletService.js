import Wallet from "../../model/walletSchema.js"
import WalletTransaction from "../../model/transactionSchema.js"


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

async function creditWallet({ userId, amount, source, orderId, reason, session }) {
  console.log("credit wallet");
  
  const existingTxn= await WalletTransaction.findOne({
    userId,
    orderId,
    source
  }).session(session)
  if(existingTxn) return 
  const wallet = await createWalletIfNotExists(userId,session);

  wallet.balance += Number(amount);
  await wallet.save({session});

  await WalletTransaction.create([{
    userId,
    amount,
    type: "CREDIT",
    source,
    orderId,
    reason,
  }],{session});
}


async function createWalletIfNotExists(userId,session) {
  console.log("wallet creating");
  
  let wallet = await Wallet.findOne({ userId }).session(session);
  if (!wallet) {
    wallet = await Wallet.create([{ userId, balance:0 }],{session});
    wallet= wallet[0]
  }
  return wallet;
}


export{
    createWalletIfNotExists,
    creditWallet,
    debitWallet
}