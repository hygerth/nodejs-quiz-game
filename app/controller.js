var Highscore 		= require('./models/highscore')

module.exports = function(app, passport, io, game, colors){

	// ==== Index ====
	app.get('/', function(req, res){
	
		res.render('index.jade', {title: 'Home'})
	
	})
	
	// ==== Login ====
	app.get('/login', function(req, res){
		res.render('login.jade', {title: 'Login'})
	})
	
	app.post('/login', passport.authenticate('login', {
		
		successRedirect	: 	'/profile',			// Login succeded, continue to profile page
		failureRedirect	: 	'/login',			// Login failed, direct back
	
	}))
	
	// ==== SignUp ===
	app.get('/register', function(req, res){
		res.render('register.jade', {title: 'Register'})
	})
	
	app.post('/register', passport.authenticate('register', {
		
		successRedirect	: 	'/profile',			// Signup succeded, continue to profile page
		failureRedirect	: 	'/register',			// Signup failed, direct back
	
	}))
	
	// === Profile ===
	app.get('/profile', isConnected, function(req, res){
		Highscore.find({ $or:[{'_playerOneId':req.user._id},{'_playerTwoId':req.user._id}]}).populate('_playerOneId _playerTwoId').exec(function(err, found){
			res.render('profile.jade', {title: 'Profile ' + req.user.username, user: req.user, hs: found})
		})
		
	
	})
	
	// ==== Logout ===
	app.get('/logout', function(req, res){
		
		req.logout()
		res.redirect('/')
	
	})
	
	// == Host Game ==
	app.get('/host', function(req, res){
		res.render('host.jade', {title: 'Host'})

	})
	
	// = Client Game =
	app.get('/client', isConnected, function(req, res){
		res.render('client.jade', {title: 'Client'})
	})
	
	// == Highscore ==
	app.get('/highscore', function(req, res){
		Highscore.find({}).populate('_playerOneId _playerTwoId').exec(function(err, found){
			res.render('highscore.jade', {title: 'Highscores', hs: found})
		})
	})
	
}


function isConnected(req, res, next){
	console.log('ISAUTH');
	if(req.isAuthenticated()) 			// If user is signed in, continue
		return next()
	
	res.redirect('/login')				// Else send to login page
	
}