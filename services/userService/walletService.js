import Wallet from "../../model/walletSchema.js"




async function createWalletIfNotExists(userId) {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId });
  }
  return wallet;
}


export{
    createWalletIfNotExists
}