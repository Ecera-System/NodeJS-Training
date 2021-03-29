var mongoose= require("mongoose");
var betSchema = new mongoose.Schema({
	isSpecial:{type:Boolean, default:false},
	desc:String,
	t1_name:String,
	t2_name:String,
	odds:Number,
	amount:Number,
	betOn:Number,
	isAcm:{type:Boolean,default:false},
    result:{type:Number,default:-1},
	awarded:{type:Boolean,default:false},
	match:{type:mongoose.Schema.Types.ObjectId,
		ref:"Match"}
	
});
module.exports = mongoose.model("Bet",betSchema);
