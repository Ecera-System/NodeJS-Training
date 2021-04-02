var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var employeeSchema = new mongoose.Schema({
	fname:{type:String,default:""},
	lname:{type:String,default:""},
	username:String,
	password:String,
	isAdmin:{type:Boolean,default:false},
	isSubAdmin:{type:Boolean,default:false},
	balance:{type:Number,default:0},
	bets:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Bet"
		}
	],
	accumulators:[
		{
			type:mongoose.Schema.Types.ObjectId,
			ref:"Accumulator"
		}
	],
	resetPasswordToken: String,
    resetPasswordExpires: Date
});
employeeSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("employee",employeeSchema);
