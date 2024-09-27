const router = require("express").Router();
const cartController = require("../controllers/cartController");
const {verifyTokenAndAuthorization, verifyAdmin} = require("../middlewares/verifyToken")


// UPADATE category
router.post("/", verifyTokenAndAuthorization, cartController.addProductToCart);

router.post("/decrement",verifyTokenAndAuthorization, cartController.decrementProductQuantity);


router.delete("/delete/:id",verifyTokenAndAuthorization, cartController.removeProductFromCart);


router.get("/",verifyTokenAndAuthorization, cartController.fetchUserCart);

router.get("/count",verifyTokenAndAuthorization, cartController.getCartCount);

router.delete("/clear/:id",verifyTokenAndAuthorization, cartController.clearUserCart);

router.post("/remove-items", verifyTokenAndAuthorization, cartController.removeProductsFromCart);








// Add Skills



module.exports = router