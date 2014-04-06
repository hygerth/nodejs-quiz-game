var mongoose 	= require('mongoose'),			// Load mongoose to talk to database
	bcrypt		= require('bcrypt-nodejs')		// Load bcrypt to encrypt the passwords
	
	


var userSchema = mongoose.Schema({				// Define the schema for the user model
	
	username	: 	String,
	password	: 	String
	
})


// ==== Methods ====

// Create a hash
userSchema.methods.generateHash = function(password){

	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)

}

// Confirm that the password is correct
userSchema.methods.confirmPassword = function(password){
	
	return bcrypt.compareSync(password, this.password)
	
}

// Create the model and make it accessible for the app
module.exports = mongoose.model('User', userSchema)