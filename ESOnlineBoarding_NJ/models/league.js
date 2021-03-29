var mongoose = require("mongoose");
var leagueSchema = new mongoose.Schema({
	name:String,
	logo:String,
	matches:[{
	type:mongoose.Schema.Types.ObjectId,
		ref:"Match"
	
}]
});
module.exports = mongoose.model("League",leagueSchema);
