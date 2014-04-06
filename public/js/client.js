(function($){    
	
	var Controller = {
		
		// Information about game
		idOfGame: 0,
		theTypeOfClient: '',
		theSocketID: '',
		
		// Player specific information
		playerID: 0,
		nameOfPlayer: '',
		UIDOfPlayer: '',
		waitScreenTemplate: '<div id="waitingForPlayers"></div>',
		gameTemplate: '<ul id="alternatives"></ul>',
	
		newPlayer: function(data){
			// Set information about the game (id and type of client = player)
			Controller.idOfGame = data.id
			Controller.theTypeOfClient = 'Player'
			
			// Send information of client to the host
			data.nameOfPlayer = Controller.nameOfPlayer
			data.playerID = Controller.theSocketID
			data.UIDOfPlayer = Controller.UIDOfPlayer
			
			Controller.socket.emit('joiningGameClient', data)
		},
			
		updateWaitScreen: function(data){
			$('.screen').html('')
			$('.screen').html(Controller.waitScreenTemplate)
			$('#waitingForPlayers').html('Waiting for a opponent to join this game')
		},
			
		startGame: function(){
			$('.screen').html('')
			$('.screen').html(Controller.gameTemplate)
		},
		
		pushOutQuestion: function(data){
			Controller.processQuestion(data.alternatives)
		},
			
		processQuestion: function(data){
			$('#alternatives').html('')
			var list = []
			for(var i in data)
			list.push(data[i])
					
			for (var i = 0; i < list.length; i++) {
				$('#alternatives').append('<li><button id="btn" value="' + list[i] +'">' + list[i] + '</button></li>')
			}
		},
			
		sendGuess: function(){
			var guess = $(this).val()
			var data = {
				id: Controller.idOfGame,
				player: Controller.theSocketID,
				guess: guess
			}
			Controller.socket.emit('makesGuessClient', data)
		},
			
		gameOver: function(){
			$('.screen').html('')
			$('.screen').html('<h1>Game Over\nCheck result on the big screen</h1>')
		},
		
		init: function(){
			// Connect to the io
			Controller.socket = io.connect();
			Controller.connectEvents();
			Controller.connectElements();
			Controller.theSocketID = Controller.socket.sessionid
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
			Controller.socket.on('username', Controller.getUsername)
			Controller.socket.on('playerJoinedAGame', Controller.updateWaitScreen)
			Controller.socket.on('questionSent', Controller.pushOutQuestion)
			Controller.socket.on('gameReadyToStart', Controller.startGame)
			Controller.socket.on('gameOver', Controller.gameOver)
		},
		
		connectElements: function(){
			$(document).on('click', '#createGame', Controller.onCreate)
			$(document).on('click', '#joinGame', Controller.onJoin)
			$(document).on('click', '#btn', Controller.sendGuess)
			$(document).on('click', '#rematch', Controller.rematch)
		},


		getUsername: function(data){
			if(Controller.nameOfPlayer == '')
			Controller.nameOfPlayer = data.user.username
			if(Controller.UIDOfPlayer == '')
			Controller.UIDOfPlayer = data.user._id
		},

		onJoin: function(data){
			var data = {id: $('#idtest').val()}
			Controller.newPlayer(data)
		}
	
	}

	Controller.init()
}($))