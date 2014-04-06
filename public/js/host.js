(function($){    

	var Controller = {
		
		// Information about the game
		idOfGame: 0,
		theTypeOfClient: '',
		theSocketID: '',
	
		// Host specific information
		numberOfPlayersInGame: 0,
		players: [],
		
		// Templates for different host scenarios
		waitScreenTemplate: '<div id="waitingForPlayers"></div><div id="playerJoinAt"></div><div id="gameCode"></div>',
		gameTemplate: '<div id="scoreboard"></div><div id="question"></div>',
		gameOverTemplate: '<div id="gameOver"><h1 id="res"></h1><p><button id="rematch">Rematch</button></p></div>',	

		rematch: function(){
			Controller.socket.emit('rematchHost', {id: Controller.idOfGame})
		},
		
		newGame: function(data){
			Controller.idOfGame = data.id
			Controller.theSocketID = data.socketID
			Controller.theTypeOfClient = 'Host'
			Controller.numberOfPlayersInGame = 0
			Controller.viewWait()
		},
		
		viewWait: function() {
			$('.screen').html(Controller.waitScreenTemplate)
			$('#waitingForPlayers').html('Waiting for ' + (2-Controller.numberOfPlayersInGame) + ' players to join')
			$('#playerJoinAt').html('Enter game code the following code to join this game')
			$('#gameCode').html(Controller.idOfGame)
		},
		
		updateWaitScreen: function(data){
			Controller.numberOfPlayersInGame += 1
			var numPlayersIngame = 2 - Controller.numberOfPlayersInGame
			$('#waitingForPlayers').html('')
			$('#waitingForPlayers').html('Waiting for ' + numPlayersIngame + ' player to join')
			
			Controller.players.push(data)
			if(Controller.numberOfPlayersInGame === 2)
			Controller.socket.emit('startGameHost', Controller.idOfGame)
		},
		
		startGame: function(data){
			$('.screen').html(Controller.gameTemplate)
			$('#scoreboard').append('<div class="playerOne" id="' + Controller.players[0].playerID + '"><p class="name">' + Controller.players[0].nameOfPlayer + '</p><p class="score">0</p></div>')
			$('#scoreboard').append('<div class="playerTwo" id="' + Controller.players[1].playerID + '"><p class="score">0</p><p class="name">' + Controller.players[1].nameOfPlayer + '</p></div>')
			var count = 5
			var countdown = setInterval(function(){
				$('#question').html('<h1>Ready?</h1><span class=countdown>' + count + '</span>')
				count -= 1
				if(count < 0){
					clearInterval(countdown)
					Controller.socket.emit('readyForAQuestionHost', data)
				}
			}, 1000)
			
		},
		
		processQuestion: function(data){
			$('#question').html('<h1>' + data.question + '</h1>')
			Controller.round = data.round
			Controller.correct = data.correct
			Controller.usedQuestions = data.usedQuestions
		},
		
		checkGuess: function(data){
			var data = {
				id: Controller.idOfGame,
				correct: Controller.correct,
				guess: data.guess,
				player: data.player
			}
			Controller.socket.emit('checkGuessHost', data)
		},
		
		updateScoreboard: function(data){
			var score =  parseInt($('#' + data.player).find('.score').html())
			var name = $('#' + data.player).find('.name').html()
			Controller.updateLog('<span class=' + data.result + '>' + name + ' guessed ' + data.result + '!</span>')
			
			if(data.result == 'correct'){
				score += 3
				$('#' + data.player).find('.score').html(score)
				Controller.round += 1
				var p1 = Controller.players[0].playerID
				var p2 = Controller.players[1].playerID
				var data = {
					id: Controller.idOfGame,
					round: Controller.round,
					usedQuestions: Controller.usedQuestions,
					p1UID: Controller.players[0].UIDOfPlayer,
					p2UID: Controller.players[1].UIDOfPlayer,
					scoreP1:  parseInt($('#' + p1).find('.score').html()),
					scoreP2:  parseInt($('#' + p2).find('.score').html()),
					nameP1: $('#' + p1).find('.name').html(),
					nameP2: $('#' + p2).find('.name').html()
				}		
				Controller.socket.emit('nextQuestionHost', data)
			}else{
				score -= 2
				$('#' + data.player).find('.score').html(score)
				var name = $('#' + data.player).find('.name').html()
			}
		},
		
		
		gameOver: function(data){			
			$('.screen').html('')
			$('.screen').html(Controller.gameOverTemplate)	
			$('#log').html('')
			if(data.result == 'Tied'){
				$('#gameOver').find('#res').html('The game was a tie!')
			}else{
				$('#gameOver').find('#res').html('The game was won by ' + data.result)
			}			
		},
		
		
		
		init: function(){
			// Connect to the io
			Controller.socket = io.connect();
			Controller.connectEvents();
			Controller.connectElements();
			Controller.theSocketID = Controller.socket.sessionid
			Controller.onCreate()
		},
	
		connectEvents: function(){
			// Socket.io
			Controller.socket.on('connectionEstablished', function(data){
				if(Controller.idOfGame == 0){
					Controller.theSocketID = data.socketID 
				}else{
					Controller.socket.emit('recon', {roomID: Controller.idOfGame})
				}
			})
			Controller.socket.on('hostCreatedNewGame',Controller.newGame)
			Controller.socket.on('playerJoinedAGame', Controller.updateWaitScreen)
			Controller.socket.on('questionSent', Controller.processQuestion)
			Controller.socket.on('gameReadyToStart', Controller.startGame)
			Controller.socket.on('aPlayerMadeAGuess', Controller.checkGuess)
			Controller.socket.on('guessChecked', Controller.updateScoreboard)
			Controller.socket.on('gameOver', Controller.gameOver)
			Controller.socket.on('log', function(data){
				Controller.updateLog(data.log)
			});
		},
	

		connectElements: function(){
			$(document).on('click', '#rematch', Controller.rematch)
		},


		onCreate: function(){
			Controller.socket.emit('createGameHost')
		},

		updateLog: function(log){
			$('#log').html('')
			$('#log').append('<p>' + log + '</p>')
		}
	}
	
	Controller.init()
}($))