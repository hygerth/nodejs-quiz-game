var colors = require('colors');
// ======= SETUP =========

var flash				= require('connect-flash'),
	express 			= require('express'),
	mongoose 			= require('mongoose'),
	passport			= require('passport'),
	cookie 				= require("cookie"),
	connect 			= require("connect"),
	parseSignedCookie 	= connect.utils.parseSignedCookie,
	http				= require('http'),
	game 				= require('./app/gameServer')
	
	
	
	
var port 		= process.env.PORT || 1337,
	app 		= express(),
	server		= http.createServer(app),
	io			= require('socket.io').listen(server),
	configDB	= require('./config/database')
	
// ====== Config =========

mongoose.connect(configDB.url)								// Connect to database specified in config file
require('./config/passport')(passport)						// Config passport
var MongoStore = require('connect-mongo')(express)
var secret = 'rogeroverrinserepeat'
var parseCookie = express.cookieParser(secret)

var sessionStore = new MongoStore({
	host: 'localhost',
	port: 27017,
	db: 'game',
	collection: 'sessions',
	stringify: false,
	clear_interval: (60)
})

// ----- Config app ------

app.use(express.logger('dev')) 								// Log everything to console
app.use(parseCookie)										// Read cookies
app.use(express.bodyParser()) 								// Read information in HTML forms
app.set('view engine', 'jade')								// Set jade for templating pages
app.use(express.session({
	secret: secret, 										// The session secret
	key: 'jsessionid',
	maxAge: new Date(Date.now() + 3600000),
	store: sessionStore
}))
app.use(express.static(__dirname + '/public'))
app.use(flash())											// Connect-flash for flash messages in sessions
app.use(function(req, res, next) {
    res.locals.flash = req.flash;
    next();
});
app.use(passport.initialize())								// Init passport
app.use(passport.session())									// Persistent login sessions



// ---- Config socket -----

io.configure(function () {
    io.set('authorization', function (data, callback) {
        if(data.headers.cookie) {
            // save parsedSessionId to handshakeData
            data.cookie = cookie.parse(data.headers.cookie)
            data.sessionId = parseSignedCookie(data.cookie['jsessionid'], secret)
        }
        callback(null, true);
    })

})


io.sockets.on('connection', function(socket){
	
    var sessionID = socket.handshake.sessionId
	sessionStore.get(sessionID, function(err, session){
		if(!err){
			if(session.passport.user){
					var User = require('./app/models/user')
					User.findById(session.passport.user, function(err, user){
						console.log(user);
						socket.emit('username', {user: user})
					})	
					
				
			}
		}
	})
	
	
	game.initGame(io, socket)


})


// ======= Lift off =======

server.listen(port)

console.log('Let the games begin at port '.yellow + port)


// ======= Routes =========

require('./app/controller')(app, passport, io, game, colors)					// Controller for routing the users