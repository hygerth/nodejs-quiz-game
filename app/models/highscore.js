var mongoose 	= require('mongoose')

var highscoreSchema = mongoose.Schema({	
	//playerOne: String,
	_playerOneId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	playerOneScore: Number,
	//playerTwo: String,
	_playerTwoId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	playerTwoScore: Number,
	gameDate: Date,
})



module.exports = mongoose.model('Highscore', highscoreSchema)