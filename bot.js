const twit = require('twit');
const client = new twit(require('./config'));
var mapPlayerMat = {};

// API
// Starting
var streamStart = client.stream('statuses/filter', {track: '@MipikerLeGrand morpion ?'});
streamStart.on('tweet', function (tweet) {
	var userScreenName = '@' + tweet.user.screen_name;
	console.log('Starting a new game with ' + userScreenName);
  	client.post('statuses/update', {status:  userScreenName + ' ok, I play pawn X and you O'});
 	var mat =	[['▢', '▢', '▢'],
				 ['▢', '▢', '▢'],
				 ['▢', '▢', '▢']];
	mapPlayerMat.userScreenName = mat;
	play(mat, 'X');
	console.log('bot played : \n' + display(mat));
	client.post('statuses/update', {status:  userScreenName + '\n' + display(mat)});
});

// Playing
var streamPlay = client.stream('statuses/filter', {track: '@MipikerLeGrand your turn'});
streamPlay.on('tweet', function(tweet) {
	var userScreenName = '@' + tweet.user.screen_name;
	var mat = mapPlayerMat.userScreenName;
	if(mat !== undefined) {
		// Getting player turn
		var msg = '';
		for(var j = 0; j < tweet.text.length; j++) {
			if(tweet.text[j] === '▢' || tweet.text[j] === 'X' || tweet.text[j] === 'O') {
				msg += tweet.text[j];
			}
		}
		var x = -1;
		var y = 0;
		for(var j = 0; j < msg.length; j++) {
			x++;
			if(x >= 3) {
				x = 0;
				y++;
			}
			if(mat[y][x] === '▢' && msg[j] === 'O') {
				mat[y][x] = msg[j];
				break;
			}
		}
		console.log(userScreenName + ' played : \n' + display(mat));
		var resultDetectWin = detectWin(mat);
		if(resultDetectWin === 'O') {
			client.post('statuses/update', {status:  userScreenName + ' Congrats, You win !!!'});
			console.log(userScreenName + ' win');
			return;
		} else if(resultDetectWin === 'N') {
			client.post('statuses/update', {status:  userScreenName + ' Ho, Noboby win ... '});
			console.log('Noboby win');
			return;
		}
		// IA turn
		play(mat, 'X');
		console.log('bot played : \n' + display(mat));
		client.post('statuses/update', {status:  userScreenName + '\n' + display(mat)});
		var resultDetectWin = detectWin(mat);
		if(resultDetectWin === 'X') {
			client.post('statuses/update', {status:  userScreenName + ' Haha, I win !!!'});
			console.log('bot win against ' + userScreenName);
			return;
		} else if(resultDetectWin === 'N') {
			client.post('statuses/update', {status:  userScreenName + ' Ho, Noboby win ... '});
			console.log('Noboby win');
			return;
		}
	} else {
		console.log(userScreenName + " tried to play but never start the game");
	}
});

// Place bot pawn
function play(mat, pawn) {
	var bestX = -1;
	var bestY = -1;
	var bestNbOponentCouldStop = 0;
	var imminentLose = false;
	stopSearch:
	for(var y = 0; y < 3; y++) {
		for(var x = 0; x < 3; x++) {
			if(mat[y][x] ==='▢') {
				var nbOponentCouldStop = 0;
				var nbOponentCouldStopLine = 0;
				var nbOwnPawnLine = 0;
				var alreadyBlockedLine = false;
				// Line
				for(var x_ = 0; x_ < 3; x_++) {
					if(x_ !== x) {
						if(mat[y][x_] !== pawn && mat[y][x_] !== '▢' && !imminentLose) {
							nbOponentCouldStop++;
							nbOponentCouldStopLine++;
						}
						if(mat[y][x_] === pawn) {
							alreadyBlockedLine = true;
							nbOwnPawnLine++;
						}
					}
				}
				if(nbOwnPawnLine === 2) {
					bestX = x;
					bestY = y;
					break stopSearch;
				}
				if(!alreadyBlockedLine && nbOponentCouldStopLine === 2) { // Imminent lose
					bestX = x;
					bestY = y;
					imminentLose = true;
				}
				// Column
				nbOponentCouldStopLine = 0;
				nbOwnPawnLine = 0;
				for(var y_ = 0; y_ < 3; y_++) {
					if(y_ !== y) {
						if(mat[y_][x] !== pawn && mat[y_][x] !== '▢' && !imminentLose) {
							nbOponentCouldStop++;
							nbOponentCouldStopLine++;
						}
						if(mat[y_][x] === pawn) {
							alreadyBlockedLine = true;
							nbOwnPawnLine++;
						}
					}
				}
				if(nbOwnPawnLine === 2) {
					bestX = x;
					bestY = y;
					break stopSearch;
				}
				if(!alreadyBlockedLine && nbOponentCouldStopLine === 2) {
					bestX = x;
					bestY = y;
					imminentLose = true;
				}
				// Diagonal \
				nbOponentCouldStopLine = 0;
				nbOwnPawnLine = 0;
				if(x === y) {
					for(var i = 0; i < 3; i++) {
						if(i !== x) {
							if(mat[i][i] !== pawn && mat[i][i] !== '▢' && !imminentLose) {
								nbOponentCouldStop++;
								nbOponentCouldStopLine++;
							}
							if(mat[i][i] === pawn) {
								alreadyBlockedLine = true;
								nbOwnPawnLine++;
							}
						}
					}
				}
				if(nbOwnPawnLine === 2) {
					bestX = x;
					bestY = y;
					break stopSearch;
				}
				if(!alreadyBlockedLine && nbOponentCouldStopLine === 2) {
					bestX = x;
					bestY = y;
					imminentLose = true;
				}
				// Diagonal /
				nbOponentCouldStopLine = 0;
				nbOwnPawnLine = 0;
				if(2 - x === y) {
					for(var i = 0; i < 3; i++) {
						if(i !== y) {
						 	if(mat[i][2 - i] !== pawn && mat[i][2 - i] !== '▢' && !imminentLose) {
								nbOponentCouldStop++;
								nbOponentCouldStopLine++;
							}
							if(mat[i][2 - i] === pawn) {
								alreadyBlockedLine = true;
								nbOwnPawnLine++;
							}
						}
					}	
				}
				if(nbOwnPawnLine === 2) {
					bestX = x;
					bestY = y;
					break stopSearch;
				}
				if(!alreadyBlockedLine && nbOponentCouldStopLine === 2) {
					bestX = x;
					bestY = y;
					imminentLose = true;
				}

				// If the bot can't lose or win, he play the place where it bloc the max nb of pawn of his opponent
				if(!imminentLose && nbOponentCouldStop > bestNbOponentCouldStop) {
					bestNbOponentCouldStop = nbOponentCouldStop;
					bestX = x;
					bestY = y;
				}
			}
		}
	}

	if(bestX !== -1 && bestY !== -1) {
		mat[bestY][bestX] = pawn;
	} else { // Happen when nobody has played when the game start because there is no best move (for the bot)
		pickRandomly(mat, pawn);
	}
}

// Detect if somebody won
function detectWin(mat) {
	// Lines
	for(var y = 0; y < 3; y++) {
		var X = 0;
		var O = 0;
		for(var x = 0; x < 3; x++) {
			if(mat[y][x] === 'X') {
				X++;
			} else if(mat[y][x] === 'O') {
				O++;
			}
		}
		if(X === 3) {
			return 'X';
		} else if (O === 3) {
			return 'O';
		}
	}
	// Columns
	for(var y = 0; y < 3; y++) {
		var X = 0;
		var O = 0;
		for(var x = 0; x < 3; x++) {
			if(mat[y][x] === 'X') {
				X++;
			} else if(mat[y][x] === 'O') {
				O++;
			}
		}
		if(X === 3) {
			return 'X';
		} else if (O === 3) {
			return 'O';
		}
	}
	// Diagonal
	var X1 = 0;
	var O1 = 0;
	var X2 = 0;
	var O2 = 0;
	for(var i = 0; i < 3; i++) {
		if(mat[i][i] === 'X') {
			X1++;
		} else if(mat[i][i] === 'O') {
			O1++;
		}
		if(mat[i][2 - i] === 'X') {
			X2++;
		} else if(mat[i][2 - i] === 'O') {
			O2++;
		}
	}
	if(X1 === 3 || X2 === 3) {
		return 'X';
	} else if(O1 === 3 || O2 === 3) {
		return 'O';
	}
	// Game not finished
	for(var y = 0; y < 3; y++) {
		for(var x = 0; x < 3; x++) {
			if(mat[y][x] === '▢') {
				return 'E'; 
			}
		}
	}
	return 'N';	// Nobody won
}

// Return a string that represent the given matrix
function display(mat) {
	var display = '';
	for(var y = 0; y < 3; y++) {
		var line = '';
		for(var x = 0; x < 3; x++) {
			line += mat[y][x];
		}
	display += line + '\n';
	}
	return display;
}

// Put the given pawn randomly in the matrix, it can be placed only if the matrix contain a least one '▢'
function pickRandomly(mat, pawn) {
	var find = false;
	do {
		x = getRandomInt(3);
		y = getRandomInt(3);
		if(mat[y][x] === '▢') {
			mat[y][x] = pawn;
			find = true;
		}
	} while(!find);
}

// Return a random integer, 0 include, max not include
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}