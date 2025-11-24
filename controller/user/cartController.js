


async function loadCart(req,res) {
    try {
        res.render('cart')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}



export {loadCart}