var mongoose 	= require('mongoose')			// Load mongoose to talk to database


var questionSchema = mongoose.Schema({
	
	question		: 	String,
	correct			: 	String,
	alternatives	: 	[String]
	
})


// Create the model and make it accessible for the app
module.exports = mongoose.model('Question', questionSchema)