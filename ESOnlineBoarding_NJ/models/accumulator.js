var mongoose= require("mongoose");
var accumulatorSchema = new mongoose.Schema({
	name:String,
	username:String,
	odds:{type:Number,default:1},
	amount:{type:Number,default:0},
	bets:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Bet"
		},
	
	],
	status:{type:String,default:"Ongoing"},
	payment:{type:Boolean,default:false},
	matches:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Match"
		},
	
	],
	disp:{type:Boolean,default:true}
	
});
module.exports = mongoose.model("Accumulator",accumulatorSchema);
