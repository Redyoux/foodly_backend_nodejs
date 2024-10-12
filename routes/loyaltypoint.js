const router = require("express").Router();

const loyaltyController = require("../controllers/loyaltyController");

const {verifyTokenAndAuthorization, verifyAdmin}= require("../middlewares/verifyToken");

router.post('/points', loyaltyController.addPoints);
router.get('/:userId', loyaltyController.getPoints);
router.get('/totalPoints/:userId', loyaltyController.getTotalPoints);

module.exports = router;