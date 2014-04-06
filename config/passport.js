var LocalStrategy	= require('passport-local').Strategy		// Load passport for local authentication

var User			= require('../app/models/user')				// Load the user model

module.exports = function(passport){
	
	// == Setup passport ==
	
	// To serialize the user for the session
	passport.serializeUser(function(user, done){
		
		done(null, user.id)
		
	})
	
	// To deserialize the user
	passport.deserializeUser(function(id, done){

		User.findById(id, function(err, user){

			done(err, user)

		})

	})
	
	
	// ==== Signup ====
	
	passport.use('register', new LocalStrategy({
		
		usernameField		:	'username',
		passwordField		:	'password',
		passReqToCallback	: 	true 				// To be able to send back the request in the callback
		
	}, function(req, username, password, done){
		
		process.nextTick(function(){
			
			// Check if the username already exists
			User.findOne({'username' : username}, function(err, user){
				
				// Check if error
				if(err)
					return done(err)
				
				// Check if the username already exists	
				if(user){
					return done(null, false, '')
				}else{
					
					// If not create the user
					var newUser 		= new User()
					newUser.username	= username
					newUser.password	= newUser.generateHash(password)	// Hash the password
					
					// Save the created user
					newUser.save(function(err){
						
						if(err)
							throw err
						return done(null, newUser)
						
					})
				}
			})
			
		})
		
	}))
	
	// ==== Login ====
	
	passport.use('login', new LocalStrategy({
		
		usernameField		:	'username',
		passwordField		:	'password',
		passReqToCallback	: 	true 				// To be able to send back the request in the callback
		
	}, function(req, username, password, done){
		
		User.findOne({'username' : username}, function(err, user){
			
			if(err)									// If error
				return done(err)
				
			if(!user)								// If no user was found
				return done(null, false, '')
			
			if(!user.confirmPassword(password))		// If wrong password
				return done(null, false, '')
			
			return done(null, user) 				// User logged in
			
		})
	
	}))
	
}