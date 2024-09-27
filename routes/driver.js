const router = require("express").Router();
const driverController = require("../controllers/driverController");
const {verifyTokenAndAuthorization, verifyDriver}= require("../middlewares/verifyToken")



// UPDATE DRIVER
router.post("/",verifyTokenAndAuthorization, driverController.registerDriver);

// DELETE DRIVER
router.delete("/:id", driverController.deleteDriver);

// UPDATE DRIVER
router.put("/:id",verifyDriver, driverController.updateDriverDetails);

//earnings
router.get("/earnings/:id", verifyDriver,  driverController.getDriversEarning);

// GET DRIVER
router.get("/",verifyDriver, driverController.getDriverDetails);


// TOGGLE DRIVER AVAILABILITY
router.patch("/availability/:id",verifyTokenAndAuthorization, driverController.setDriverAvailability);


module.exports = router;
