import Wallet from "../../model/walletSchema.js"
import Transaction from "../../model/transactionSchema.js"


async function loadWallet(req,res) {
    try {
        let userId= req.session.user._id
        const wallet=await Wallet.findOne({userId})
        const transaction= await Transaction.findOne({userId})

        res.render('wallet',{balance:wallet.balance,transaction})
    } catch (error) {
        return res.redirect('/pageNotFound')
    }
}

export {
    loadWallet,
}