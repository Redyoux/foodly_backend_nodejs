const router = require("express").Router();
const userController = require("../controllers/userController");
const {verifyTokenAndAuthorization, verifyAdmin}= require("../middlewares/verifyToken")


// UPADATE USER
router.put("/",verifyTokenAndAuthorization, userController.updateUser);

router.get("/verify/:otp",verifyTokenAndAuthorization, userController.verifyAccount);
router.get("/customer_service", userController.getAdminNumber);
router.post("/feedback",verifyTokenAndAuthorization, userController.userFeedback)
router.get("/verify_phone/:phone",verifyTokenAndAuthorization, userController.verifyPhone);

// DELETE USER

router.delete("/" , verifyTokenAndAuthorization, userController.deleteUser);

// GET USER

router.get("/",verifyTokenAndAuthorization, userController.getUser);

router.put("/updateToken/:token",verifyTokenAndAuthorization, userController.updateFcm);

// Add Skills



module.exports = router