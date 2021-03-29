var mongoose = require("mongoose");
var withdrawSchema = new mongoose.Schema({
	username:String,
	amount:Number,
	paypal:String

});
module.exports = mongoose.model("Withdrawal",withdrawSchema);
