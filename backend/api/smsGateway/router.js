const express = require("express");
const router = express.Router();

const { gatewayAuth, pending, status } = require("./controller");

// Android утсан дээрх SMS gateway app (sms_gateway_app) ашиглана.
// Header: Authorization: Bearer <SMS_GATEWAY_TOKEN>
router.route("/pending").get(gatewayAuth, pending);
router.route("/:id/status").post(gatewayAuth, status);

module.exports = router;
