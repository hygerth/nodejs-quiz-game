var io
var socket
var Highscore 		= require('./models/highscore')
var Question		= require('./models/question')	
var questionsJSON 	= null

// event form 'event'+'whoisdoingit(Client/Host)'

// Exports makes the initGame function available for server.js
exports.initGame = function(serverIO, serverSocket){
	io = serverIO
	socket = serverSocket
	
	Question.count(function(err, count){
		if(err) console.log(err)
		if(count == 0){
			populateDB()
		}
	})
	
	// Assign events for the host and the clients
	socket.on('createGameHost', createGameHost)
	socket.on('startGameHost', startGameHost)
	socket.on('readyForAQuestionHost', beginGameHost)
	socket.on('nextQuestionHost', nextQuestionHost)
	socket.on('checkGuessHost', checkGuessHost)
	socket.on('rematchHost', rematchHost)
	
	socket.on('joiningGameClient', joiningGameClient)
	socket.on('makesGuessClient', makesGuessesClient)
	
	socket.emit('connectionEstablished', {socketID: socket.id}) // New connection
	socket.on('recon', recon)									// Reconnected after server crash

	getQuestions()
}

function recon(data){
	
	this.join(data.roomID)
	
}


// Host methods

// Create game
function createGameHost() {
	// Random id for game (id for socket.io room)
	var id = Math.floor(Math.random() * 1000 + 1) // Intervall 1 - 1000
	// Send the game id (room id) and the socket id to client for connection
	this.emit('hostCreatedNewGame', {id: id, socketID: socket.id})
	// Then the host joins the (socket.io) room with the id
	this.join(id.toString())
}



function startGameHost(data){
	// Ready to start the game now
	io.sockets.in(data.id).emit('gameReadyToStart', data)
}

// Begin game
function beginGameHost(data){
	console.log('A host has requested to start a game \n Sending the first question!')
	sendQ(0,data)
}

// Push out new question or return winner if game has done 10 rounds
function nextQuestionHost(data){
	if(data.round == 10){
		var scoreP1 =  data.scoreP1
		var scoreP2 =  data.scoreP2
		var nameP1 = data.nameP1
		var nameP2 = data.nameP2
		
		updateHS(data) // Add result to db
		
		var result
		
		if(scoreP1 == scoreP2){
			result = 'Tied'
		}else if(scoreP1 < scoreP2){
			result = nameP2
		}else{
			result = nameP1
		}
		
		io.sockets.in(data.id).emit('gameOver', {result: result})
	}else {
		sendQ(data.round, data)
	}
	
}

// Check if player made a correct guess
function checkGuessHost(data){
	var result = 'wrong'
	if(data.guess == data.correct){
		result = 'correct'
	}
	data.result = result
	io.sockets.in(data.id).emit('guessChecked', data)
}

// New Game / rematch
function rematchHost(data){
	io.sockets.in(data.id).emit('gameReadyToStart', data)
}

// Client

// A player joined a Game
function joiningGameClient(data){
	var playerSocket = this
	var findRoom = socket.manager.rooms['/' + data.id] // Try to find the room specified
	if(findRoom){ // if found then join the room
		data.socketID = playerSocket.id // Add the socket id to the data to return
		playerSocket.join(data.id) // Player client joins the specified room
		io.sockets.in(data.id).emit('playerJoinedAGame', data) // Send playerJoinedAGame message to clients in the room, only!
		this.emit('log', {log: 'Player joined ' + data.id})
	}else{
		this.emit('log', {log: 'Couldn´t find game ' + data.id})
	}
	
}

// Player made a guess
function makesGuessesClient(data){
	io.sockets.in(data.id).emit('aPlayerMadeAGuess', data)
}


// Game logic

// Update highscore db
function updateHS(data){
	var hs = {
		//playerOne: data.nameP1,
		_playerOneId: data.p1UID,
		playerOneScore: data.scoreP1,
		//playerTwo: data.nameP2,
		_playerTwoId: data.p2UID,
		playerTwoScore: data.scoreP2,
		gameDate: new Date
	}
	var data = new Highscore(hs)
	data.save(function (err) {
		if (err) return handleError(err)
		// saved!
		console.log('\nNew highscore ADDED')
	})
}

// Add questions to db (happens only when the db is empty)
function populateDB(){
	var qa = [
		{
			question		: 	"In which British TV sitcom did the character David Brent appear?",
			correct			: 	"The Office",
			alternatives	: 	["Ever Decreasing Circles", "League Of Gentlemen", "Never The Twain"]
		},
		{
			question		: 	"What is the surname of 'Frasier' in the TV sitcom of the same name?",
			correct			: 	"Crane",
			alternatives	: 	["Craig", "Craven", "Cray"]
		},
		{
			question		: 	"Which 1990s sitcom, set in California, starred comic actor Will Smith?",
			correct			: 	"Fresh Prince Of Bel-Air",
			alternatives	: 	["Cheers", "Mork And Mindy", "The Golden Girls"]
		},
		{
			question		: 	"What was the name of the waitress played by Connie Booth in 'Fawlty Towers'?",
			correct			: 	"Polly",
			alternatives	: 	["Elsie", "Millie", "Sybil"]
		},
		{
			question		: 	"In which city is the TV sitcom 'Friends' set?",
			correct			: 	"New York",
			alternatives	: 	["Boston", "Chicago", "Los Angeles"]
		},
		{
			question		: 	"In which major conflict is the sitcom 'Blackadder Goes Forth' set?",
			correct			: 	"World War I",
			alternatives	: 	["Crimean War", "Napoleonic War", "World War II"]
		},
		{
			question		: 	"What was Woody, the barman's surname in the TV sitcom 'Cheers'?",
			correct			: 	"Boyd",
			alternatives	: 	["Fenton", "Lambert", "Malone"]
		},
		{
			question		: 	"In the sitcom 'Allo Allo', who painted 'The Fallen Madonna With The Big Boobies'?",
			correct			: 	"Van Clomp",
			alternatives	: 	["Van Glump", "Van Pump", "Van Trump"]
		},
		{
			question		: 	"Which female impersonator made a guest appearance in 'Mr Bean In Room 426'?",
			correct			: 	"Danny La Rue",
			alternatives	: 	["Barry Humphries", "Eddie Izzard", "Paul O'Grady"]
		},
		{
			question		: 	"What is the name of the coffee shop regularly used by the characters, in the TV sitcom 'Friends'?",
			correct			: 	"Central Perk",
			alternatives	: 	["Bean Town", "Grounds Swell", "Sunbucks"]
		},
		{
			question		: 	"In TV sitcom 'Friends' episode 'The One With Ross's Wedding, Part One', what does Richard Branson sell Joey in a London street?",
			correct			: 	"A hat",
			alternatives	: 	["A model double decker bus", "An umbrella", "A watch"]
		},
		{
			question		: 	"In Monty Pythons 'The Lumberjack Song', what does the lumberjack have for tea?",
			correct			: 	"Buttered scones",
			alternatives	: 	["Crumpets", "Cucumber sandwiches", "Toasted teacakes"]
		},
		{
			question		: 	"In Monty Python, what does John Cleese's character buy at the beginning of the 'Ministry of Silly Walks' sketch?",
			correct			: 	"A newspaper",
			alternatives	: 	["A bunch of flowers", "An ice cream", "An umbrella"]
		},
		{
			question		: 	"Frasier was created as a spin-off of which other sitcom?",
			correct			: 	"Cheers",
			alternatives	: 	["The Cosby Show", "Friends", "The Golden Girls"]
		},
		{
			question		: 	"What is the TV show 'Psych' signature fruit?",
			correct			: 	"Pineapple",
			alternatives	: 	["Watermelon", "Orange", "Kiwi"]
		},
		{
			question		: 	"Which institution do Sheldon, Leonard, Raj and Howard work at, in 'The Big Bang Theory'?",
			correct			: 	"Caltech",
			alternatives	: 	["Bell Labs", "SRI International", "MIT"]
		},
		{
			question		: 	"In the show 'Burn Notice', what was Sam Axe´s alias?",
			correct			: 	"Chuck Finley",
			alternatives	: 	["Nick Halden", "Dante Haversham", "Ivan Bliminse"]
		},
		{
			question		: 	"In the show 'White Collar', what alias does Neal Caffery use the most?",
			correct			: 	"Nick Halden",
			alternatives	: 	["Chuck Finley", "Captain Awesome", "Ted Mosby, Architect"]
		},
		{
			question		: 	"In 'How I Met Your Mother', which celebrity does Marshall share the 'best burger in the world' with?",
			correct			: 	"Regis Philbin",
			alternatives	: 	["Meredith Vieira", "Bob Barker", "Matt Lauer"]
		},
		{
			question		: 	"In 'Psych', which other TV show can´t Shawn Spencer believe people give an hard time?",
			correct			: 	"The Mentalist",
			alternatives	: 	["How I Met Your Mother", "Suits", "Castle"]
		}
	]
	for(var q in qa){
		var data = new Question(qa[q]);
		data.save(function (err) {
			if (err) return handleError(err)
		})
	}
	console.log('Questions ADDED')
}

// Choose a question, send question to host and alternatives to clients
function sendQ(round, data){
	var usedQuestions = data.usedQuestions || []
	console.log(usedQuestions);
	usedQuestions = usedQuestions.slice()
	var qnr = Math.floor(Math.random() * questionsJSON.length) 
	while (usedQuestions.contains(qnr)) {
		qnr = Math.floor(Math.random() * questionsJSON.length) 
	}
	
	usedQuestions.push(qnr)
	
	var id = data.id
	var question = questionsJSON[qnr]
	
	var alt = question.alternatives.slice()
	alt.push(question.correct)
	
	shuffle(alt)
	var data = {
		id: id,
		round: round,
		usedQuestions: usedQuestions,
		question: question.question,
		correct: question.correct,
		alternatives: alt
	}
	io.sockets.in(data.id).emit('questionSent', data)
}

// Collect questions from db
function getQuestions(){
	Question.find({}, function(err, questions){
		if (!err){ 
			questionsJSON =  questions
		}else { throw err}
	})
}


// Mix up the alternatives
// Source: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array){
	var currentIndex = array.length
	, temporaryValue
	, randomIndex
	;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;
}


// A method for arrays to check if it contains an element, e.g. find needle in haystack
Array.prototype.contains = function ( needle ) {
   for (i in this) {
       if (this[i] == needle) return true;
   }
   return false;
}
