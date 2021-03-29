var mongoose = require("mongoose");
var matchSchema = new mongoose.Schema({
	isSpecial:{type:Boolean, default:false},
	desc:String,
	t1_name:String,
	t2_name:String,
	t1_odds:Number,
	t2_odds:Number,
	d_odds:Number,
	status:{type:String,default:"NS"}, 
	winner:{type:Number,default:0},
	display:{type:Boolean,default:true},
	bets:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Bet"
		},
	
	],
	maxbet:{type:Number,default:-1},
	time:Date
	
});
module.exports = mongoose.model("Match",matchSchema);
