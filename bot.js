var twit = require('twit');
var client = new twit(require('./config'));
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
	console.log(userScreenName + " replie")
	var mat = mapPlayerMat.userScreenName;
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
		if(mat[x][y] === '▢' && msg[j] !== '▢') {
			mat[x][y] = msg[j];
			break;
		}
	}
	console.log(userScreenName + ' played : \n' + display(mat));
	var resultDetectWin = detectWin(mat);
	if(resultDetectWin === 'O') {
		client.post('statuses/update', {status:  userScreenName + ' Congrats, You win !!!'});
		return;
	} else if(resultDetectWin === 'N') {
		client.post('statuses/update', {status:  userScreenName + ' Ho, Noboby win ... '});
		return;
	}
	// IA turn
	play(mat, 'X');
	console.log('bot played : \n' + display(mat));
	client.post('statuses/update', {status:  userScreenName + '\n' + display(mat)});
	var resultDetectWin = detectWin(mat);
	if(resultDetectWin === 'X') {
		client.post('statuses/update', {status:  userScreenName + ' Haha, I win !!!'});
		return;
	} else if(resultDetectWin === 'N') {
		client.post('statuses/update', {status:  userScreenName + ' Ho, Noboby win ... '});
		return;
	}
});

// Place bot pawn
function play(mat, pawn) {
	var bestX = -1;
	var bestY = -1;
	var bestNbOponentCouldStop = 0;
	stopSearch:
	for(var y = 0; y < 3; y++) {
		for(var x = 0; x < 3; x++) {
			if(mat[x][y] ==='▢') {
				var nbOponentCouldStop = 0;
				var nbOponentCouldStopLine = 0;
				var alreadyBlockedLine = false;
				// Line
				for(var x_ = 0; x_ < 3; x_++) {
					if(x_ !== x) {
						if(mat[x_][y] !== pawn && mat[x_][y] !== '▢') {
							nbOponentCouldStop++;
							nbOponentCouldStopLine++;
						}
						if(mat[x_][y] === pawn) {
							alreadyBlockedLine = true;
						}
					}
				}
				if(!alreadyBlockedLine && nbOponentCouldStopLine === 2) {
					bestX = x;
					bestY = y;
					break stopSearch;
				}
				// Column
				nbOponentCouldStopLine = 0;
				for(var y_ = 0; y_ < 3; y_++) {
					if(x_ !== x) {
						if(mat[x][y_] !== pawn && mat[x][y_] !== '▢') {
							nbOponentCouldStop++;
							nbOponentCouldStopLine++;
						}
						if(mat[x][y_] === pawn) {
							alreadyBlockedLine = true;
						}
					}
				}
				if(!alreadyBlockedLine && nbOponentCouldStopLine === 2) {
					bestX = x;
					bestY = y;
					break stopSearch;
				}
				// Diagonal \
				nbOponentCouldStopLine = 0;
				if(x === y) {
					for(var i = 0; i < 3; i++) {
						if(i !== x) {
							if(mat[i][i] !== pawn && mat[i][i] !== '▢') {
								nbOponentCouldStop++;
								nbOponentCouldStopLine++;
							}
							if(mat[i][i] === pawn) {
								alreadyBlockedLine = true;
							}
						}
					}
				}
				if(!alreadyBlockedLine && nbOponentCouldStopLine === 2) {
					bestX = x;
					bestY = y;
					break stopSearch;
				}
				// Diagonal /
				nbOponentCouldStopLine = 0;
				if(2 - x === y) {
					for(var i = 0; i < 3; i++) {
						if(i !== y) {
						 	if(mat[2 - i][i] !== pawn && mat[2 - i][i] !== '▢') {
								nbOponentCouldStop++;
								nbOponentCouldStopLine++;
							}
							if(mat[2 - i][i] === pawn) {
								alreadyBlockedLine = true;
							}
						}
					}	
				}
				if(!alreadyBlockedLine && nbOponentCouldStopLine === 2) {
					bestX = x;
					bestY = y;
					break stopSearch;
				}

				// If the bot can't lose, he play the place where it bloc the max nb of pawn of his opponent
				if(nbOponentCouldStop > bestNbOponentCouldStop) {
					bestNbOponentCouldStop = nbOponentCouldStop;
					bestX = x;
					bestY = y;
				}
			}
		}
	}

	if(bestX !== -1 && bestY !== -1) {
		mat[bestX][bestY] = pawn;
	} else { // Happen when nobody has played when the game start because thre is no best move
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
			if(mat[x][y] === 'X') {
				X++;
			} else if(mat[x][y] === 'Y') {
				Y++;
			}
		}
		if(X === 3) {
			return 'X';
		} else if (O === 3) {
			return 'O';
		}
	}
	// Columns
	for(var x = 0; x < 3; x++) {
		var X = 0;
		var O = 0;
		for(var y = 0; y < 3; y++) {
			if(mat[x][y] === 'X') {
				X++;
			} else if(mat[x][y] === 'Y') {
				Y++;
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
		} else if(mat[i][i] === 'Y') {
			Y1++;
		}
		if(mat[2 - i][i] === 'X') {
			X2++;
		} else if(mat[2 - i][i] === 'Y') {
			Y2++;
		}
	}
	if(X1 === 3 || X2 === 3) {
		return 'X';
	} else if(O1 === 3 || O2 === 3) {
		return 'O';
	}
	// Noboby
	var nobodyWon = true;
	for(var y = 0; y < 3; y++) {
		for(var x = 0; x < 3; x++) {
			if(mat[x][y] === '▢') {
				nobodyWon = false;
			}
		}
	}
	if(nobodyWon) {
		return 'N';	
	}
	// Game not finished
	return 'E';
}

// Return a string that represent the given matrix
function display(mat) {
	var display = '';
	for(var y = 0; y < 3; y++) {
		var line = '';
		for(var x = 0; x < 3; x++) {
			line += mat[x][y];
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
		if(mat[x][y] === '▢') {
			mat[x][y] = pawn;
			find = true;
		}
	} while(!find);
}

// Return a random integer, 0 include, max not include
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}