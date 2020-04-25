var twit = require('twit');
var client = new twit(require('./config'));

var streamStart = client.stream('statuses/filter', {track: '@MipikerLeGrand morpion ?'});
streamStart.on('tweet', function (tweet) {
	var userScreenName = '@' + tweet.user.screen_name;
	console.log("Starting a new game with " + userScreenName);
  	client.post('statuses/update', {status:  userScreenName + ' ok, I play pawn X and you O'});
 	var mat =	[['▢', '▢', '▢'],
				 ['▢', '▢', '▢'],
				 ['▢', '▢', '▢']];
	play(mat, 'X');
	console.log('bot played : \n' + display(mat));
	client.post('statuses/update', {status:  userScreenName + '\n' + display(mat)});
	var streamPlay = client.stream('statuses/filter', {track: '@MipikerLeGrand your turn :'});
	streamPlay.on('tweet', function(tweet) {
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
			if(mat[x][y] === '▢' && msg[j] != '▢') {
				mat[x][y] = msg[j];
				break;
			}
		}
		console.log(userScreenName + ' played : \n' + display(mat));
		play(mat, 'X');
		console.log('bot played : \n' + display(mat));
		client.post('statuses/update', {status:  userScreenName + '\n' + display(mat)});
	});
});

function play(mat, pawn) {
	// Bloc player strategy
	var bestX = -1;
	var bestY = -1;
	var nbO = 0;
	for(var y = 0; y < 3; y++) {
		for(var x = 0; x < 3; x++) {
			if(mat[x][y] ==='▢') {
				var actNbO = 0;
				for(var x_ = 0; x_ < 3; x_++) {
					if(x_ != x && mat[x_][y] != pawn && mat[x_][y] != '▢') {
						actNbO++;
					}
				}
				for(var y_ = 0; y_ < 3; y_++) {
					if(y_ != y && mat[x][y_] != pawn && mat[x][y_] != '▢') {
						actNbO++;
					}
				}
				if(actNbO > nbO) {
					nbO = actNbO;
					bestX = x;
					bestY = y;
				}
			}
		}
	}

	if(bestX === -1 && bestY === -1) {
		pickRandomly(mat, pawn);
	} else {
		mat[bestX][bestY] = pawn;
	}
}

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

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}