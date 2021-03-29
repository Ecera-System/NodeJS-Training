var mongoose = require("mongoose");
var categorySchema = new mongoose.Schema({
	name:String,
	logo:String,
	leagues:[{
	type:mongoose.Schema.Types.ObjectId,
		ref:"League"
	
}]
});
module.exports = mongoose.model("Category",categorySchema);
