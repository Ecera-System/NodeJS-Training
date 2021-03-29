var mongoose = require("mongoose");
var depositSchema = new mongoose.Schema({
	username:String,
	amount:Number,
	success:Boolean

});
module.exports = mongoose.model("Deposit",depositSchema);
