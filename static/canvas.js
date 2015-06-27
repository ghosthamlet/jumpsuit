"use strict";

function Planet(x, y, radius, color, enemyAmount) {
	this.box = new Circle(new Point(x, y), radius);
	this.atmosBox = new Circle(this.box.center, radius * (1.5 + Math.random()/2));
	this.color = color;
	this.player = -1;

	this.enemies = [];
	var lastEnemyAng = 0;
	for (var j = 0; j < enemyAmount; j++){
		var enemyAng = Math.map(Math.random(), 0, 1, lastEnemyAng + Math.PI / 4, lastEnemyAng + Math.PI * 1.875),
			enemyDistance = Math.floor(Math.map(Math.random(), 0, 1, this.atmosBox.radius, this.atmosBox.radius * 4));
		this.enemies[j] = new Enemy(Math.sin(enemyAng) * enemyDistance + this.box.center.x, -Math.cos(enemyAng) * enemyDistance + this.box.center.y);
		lastEnemyAng = enemyAng;
	}
}
function Enemy(x, y, appearance){
	this.x = x;
	this.y = y;
	this.appearance = appearance !== undefined ? appearance : "enemy" + this.resources[Math.floor(Math.random() * this.resources.length)];
	this.box = new Rectangle(new Point(x, y), resources[this.appearance].width, resources[this.appearance].height);
	this.aggroBox = new Circle(new Point(x, y), 350);
	this.fireRate = 0;
	this.angle = 0
	this.shots = [];
}
Enemy.prototype.resources = ["Black1", "Black2", "Black3", "Black4", "Black5", "Blue1", "Blue2", "Blue3", "Green1", "Green2", "Red1", "Red2", "Red3"];

var canvas = document.getElementById("canvas"),
	context = canvas.getContext("2d"),
	resources = {},
	meteors = [],
	pause = 0,
	player = {
		health: 10, facesLeft: false, name: "alienGreen", playerName: "Unnamed Player",
		velX: 0, velY: 0,
		_walkFrame: "_stand", walkCounter: 0, walkState: 0, fuel: 0,
		set walkFrame(v){
			this._walkFrame = v;
			this.box.width = resources[this.name + this.walkFrame].width;
			this.box.height = resources[this.name + this.walkFrame].height;
		},
		get walkFrame(){
			return this._walkFrame;
		},
		attachedPlanet: -1, leavePlanet: false,
		oldChunkX: 0, oldChunkY: 0
	},
	game = {
		paused: false,
		muted: false,
		dragStartX: 0,
		dragStartY: 0,
		dragX: 0,
		dragY: 0
	},
	chunks = [],
	chunkSize = 4000,
	planets = [],
	offsetX = 0, offsetY = 0,
	controls = {
		jump: 0,
		crouch: 0,
		jetpack: 0,
		moveLeft: 0,
		moveRight: 0
	};


function init(){
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	location.hash = "";

	[].forEach.call(document.querySelectorAll("#controls img"), function (element){
		element.setAttribute("style", "display: none;");
	});	

	init.paths = [
		"background.png",
		"meteorBig1.svg", "meteorBig2.svg", "meteorBig3.svg", "meteorBig4.svg", "meteorMed1.svg", "meteorMed2.svg", "meteorSmall1.svg", "meteorSmall2.svg", "meteorTiny1.svg", "meteorTiny2.svg",
		"shield.png", "pill_red.png", "laserBeam.png", "laserBeamDead.png",
		"alienBlue_badge.svg", "alienBlue_duck.svg", "alienBlue_hurt.svg", "alienBlue_jump.svg", "alienBlue_stand.svg", "alienBlue_walk1.svg", "alienBlue_walk2.svg",
		"alienBeige_badge.svg", "alienBeige_duck.svg", "alienBeige_hurt.svg", "alienBeige_jump.svg", "alienBeige_stand.svg", "alienBeige_walk1.svg", "alienBeige_walk2.svg",
		"alienGreen_badge.svg", "alienGreen_duck.svg", "alienGreen_hurt.svg", "alienGreen_jump.svg", "alienGreen_stand.svg", "alienGreen_walk1.svg", "alienGreen_walk2.svg",
		"alienPink_badge.svg", "alienPink_duck.svg", "alienPink_hurt.svg", "alienPink_jump.svg", "alienPink_stand.svg", "alienPink_walk1.svg", "alienPink_walk2.svg",
		"alienYellow_badge.svg", "alienYellow_duck.svg", "alienYellow_hurt.svg", "alienYellow_jump.svg", "alienYellow_stand.svg", "alienYellow_walk1.svg", "alienYellow_walk2.svg",
		"enemyBlack1.svg", "enemyBlack2.svg", "enemyBlack3.svg", "enemyBlack4.svg", "enemyBlack5.svg",
		"enemyBlue1.svg", "enemyBlue2.svg", "enemyBlue3.svg", "enemyBlue4.svg", "enemyBlue5.svg",
		"enemyGreen1.svg", "enemyGreen2.svg", "enemyGreen3.svg", "enemyGreen4.svg", "enemyGreen5.svg",
		"enemyRed1.svg", "enemyRed2.svg", "enemyRed3.svg", "enemyRed4.svg", "enemyRed5.svg"
	];

	context.canvas.fillStyle = "black";
	context.fillRect(0,0, canvas.width, canvas.height);
	context.font = "16px Open Sans";
	context.textBaseline = "top";
	context.textAlign = "center";
	
	loadProcess(function(){//gets called once every resource is loaded
		player.box = new Rectangle(new Point(0, 0), resources[player.name + player.walkFrame].width, resources[player.name + player.walkFrame].height);
		document.getElementById("multiplayer-box").className = "multiplayer-box";		
		loop();
	});
}

function loadProcess(callback){
	if (loadProcess.progress === undefined) loadProcess.progress = 0;
	function eHandler() {
		loadProcess.progress++;
		if (loadProcess.progress !== init.paths.length) {
			loadProcess(callback);
		} else {
			callback();
		}
	}

	context.fillStyle = "#121012";
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.fillStyle = "#007d6c";
	context.fillRect(0, 0, ((loadProcess.progress + 1) / init.paths.length) * canvas.width, 15);

	context.fillStyle = "#eee";
	context.font = "60px Open Sans";
	context.fillText("JumpSuit", canvas.width / 2, canvas.height * 0.35);
	context.font = "28px Open Sans";
	context.fillText("A canvas game by Getkey & Fju", canvas.width / 2, canvas.height * 0.35 + 80);

	var r = new Image();
	r.addEventListener("load", eHandler);
	r.src = "assets/images/" + init.paths[loadProcess.progress];
	resources[init.paths[loadProcess.progress].slice(0, init.paths[loadProcess.progress].lastIndexOf("."))] = r;
}

function loop(){
	handleGamepad();
	function drawRotatedImage(image, x, y, angle, mirror){
		//courtesy of Seb Lee-Delisle
		context.save();
		context.translate(x, y);
		context.rotate(angle);
		if (mirror === true) context.scale(-1, 1);
		context.drawImage(image, -(image.width / 2), -(image.height / 2));
		context.restore();
	}

	function fillCircle(cx, cy, r){
		context.save();

		context.beginPath();
		context.arc(cx, cy, r, 0, 2 * Math.PI, false);
		context.closePath();
		context.fill();

		context.clip();

		context.lineWidth = 12;
		context.shadowColor = "black";
		context.shadowBlur = 30;
		context.shadowOffsetX = -10;
		context.shadowOffsetY = -10;

		context.beginPath();
		context.arc(cx, cy + 1, r + 7, -1/7 * Math.PI, 3/5 * Math.PI);
		context.stroke();

		context.restore();
	}

	function strokeCircle(cx, cy, r, sw){
		context.save();
		context.beginPath();
		context.arc(cx, cy, r, 0, 2 * Math.PI, false);
		context.globalAlpha = 0.1;
		context.fill();
		context.globalAlpha = 1;
		context.strokeStyle = context.fillStyle;
		context.lineWidth = sw;
		context.stroke();
		context.restore();
	}

	function drawArrow(fromx, fromy, ang, dist, col){
		var len = (dist > 200) ? 200 : (dist < 70) ? 70 : dist;

		var tox = fromx + Math.sin(Math.PI - ang) * len,
			toy = fromy - Math.cos(Math.PI - ang) * len;
		context.beginPath();
		context.moveTo(fromx, fromy);
		context.lineTo(tox, toy);
		context.lineWidth = 5;
		context.strokeStyle = col;
		context.stroke();
	}

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	context.globalAlpha = 1;
	context.clearRect(0, 0, canvas.width, canvas.height);


	//layer 0: background
	for (var i = 0; i < Math.floor(canvas.width / 256) + 1; i++){
		for (var j = 0; j < Math.floor(canvas.height / 256) + 1; j++){
			context.drawImage(resources["background"], i * 256, j * 256);
		}
	}


	//layer 1: meteors
	if (Math.random() < 0.01){
		var m_resources = ["meteorBig1", "meteorBig2", "meteorBig3", "meteorBig4", "meteorMed1",	"meteorMed2", "meteorSmall1", "meteorSmall2", "meteorTiny1", "meteorTiny2"],
			m_rand = Math.floor(1 / Math.random()) - 1,
			chosen_img = m_resources[(m_rand > m_resources.length - 1) ? m_resources.length - 1 : m_rand];

		meteors[meteors.length] = {
			x: -resources[chosen_img].width/2,
			y: Math.map(Math.random(), 0, 1, -resources[chosen_img].height + 1, canvas.height - resources[chosen_img].height - 1),
			res: chosen_img,
			speed: Math.map(Math.random(), 0, 1, 2, 4),
			ang: Math.map(Math.random(), 0, 1, 0.25 * Math.PI, 0.75 * Math.PI),
			rotAng: Math.map(Math.random(), 0, 1, 0, 2 * Math.PI),
			rotSpeed: Math.map(Math.random(), 0, 1, -0.05, 0.05),
			depth: Math.map(Math.random(), 0, 1, 0.2, 0.6)
		};
	}
	meteors.forEach(function(m, i){
		m.x += Math.sin(m.ang) * m.speed;
		m.y += Math.cos(m.ang) * m.speed;
		context.globalAlpha = m.depth;
		m.rotAng += m.rotSpeed;
		if (m.x - resources[m.res].width/2 > canvas.width || m.y - resources[m.res].height/2 > canvas.height || m.y + resources[m.res].height/2 < 0) meteors.splice(i, 1);
		else drawRotatedImage(resources[m.res], m.x, m.y, m.rotAng);
	});

	context.globalAlpha = 1;


	//layer 2: the game
	offsetX = ((player.box.center.x - canvas.width / 2 + (game.dragStartX - game.dragX)) + 19 * offsetX) / 20;
	offsetY = ((player.box.center.y - canvas.height / 2 + (game.dragStartY - game.dragY)) + 19 * offsetY) / 20;
		var windowBox = new Rectangle(new Point(canvas.clientWidth/2 + offsetX, canvas.clientHeight/2 + offsetY), canvas.clientWidth, canvas.clientWidth);

	planets.forEach(function (planet){
		context.fillStyle = planet.color;
		if (windowBox.collision(planet.atmosBox)) strokeCircle(planet.box.center.x - offsetX, planet.box.center.y - offsetY, planet.atmosBox.radius, 2);
		if (windowBox.collision(planet.box)) fillCircle(planet.box.center.x - offsetX, planet.box.center.y - offsetY, planet.box.radius);

		planet.enemies.forEach(function (enemy, ei){
			if (!(enemy.aggroBox.collision(player.box))){
				enemy.box.angle = enemy.box.angle + Math.PI / 150;
				enemy.fireRate = 0;
			} else {
				enemy.box.angle = Math.PI - Math.atan2(enemy.box.center.x - player.box.center.x, enemy.box.center.y - player.box.center.y);
				if (++enemy.fireRate >= 20) {
					enemy.fireRate = 0;
					enemy.shots[enemy.shots.length] = {x: enemy.box.center.x, y: enemy.box.center.y, a: enemy.box.angle - Math.PI, lt: 200}; //lt = lifetime
					playSound("laser");
				}
			}

			enemy.shots.forEach(function (shot, si){
				shot.x += (shot.lt <= 0) ? 0 : Math.sin(shot.a) * 11;
				shot.y += (shot.lt <= 0) ? 0 : -Math.cos(shot.a) * 11;
				if (shot.x - offsetX < 0 || shot.x - offsetX > canvas.width || shot.y - offsetY < 0 || shot.y - offsetY > canvas.height || --shot.lt <= -20) enemy.shots.splice(si, 1);
				else if ((new Circle(new Point(shot.x, shot.y), resources["laserBeam"].width / 2)).collision(player.box)){//to be replaced with `shot.box.collision()`
					player.health -= (player.health = 0) ? 0 : 1;
					enemy.shots.splice(si, 1);
				}
				drawRotatedImage(resources[(shot.lt <= 0) ? "laserBeamDead" : "laserBeam"], shot.x - offsetX, shot.y - offsetY, shot.a, false);
			});
			context.fillStyle = "#aaa";
			if (windowBox.collision(enemy.aggroBox)) strokeCircle(enemy.box.center.x - offsetX, enemy.box.center.y - offsetY, 350, 4);
			if (windowBox.collision(enemy.box)) drawRotatedImage(resources[enemy.appearance], enemy.box.center.x - offsetX, enemy.box.center.y - offsetY, enemy.box.angle, false);
		});
	});

	if (controls["jump"] > 0 && player.leavePlanet === false){
		player.leavePlanet = true;
		player.attachedPlanet = -1;
		player.walkFrame = "_jump";
		player.velX = Math.sin(player.box.angle) * 6;
		player.velY = -Math.cos(player.box.angle) * 6;
	}

	if (player.attachedPlanet >= 0){
		fadeBackground(true);
		var stepSize = Math.PI * 0.007 * (150 / planets[player.attachedPlanet].box.radius);
		if (controls["moveLeft"] > 0){
			stepSize = stepSize * controls["moveLeft"];
			planets[player.attachedPlanet].player += (controls["run"]) ? 1.7 * stepSize : 1 * stepSize;
			player.looksLeft = true;
		}
		if (controls["moveRight"] > 0){
			stepSize = stepSize * controls["moveRight"];
			planets[player.attachedPlanet].player -= (controls["run"]) ? 1.7 * stepSize : 1 * stepSize;
			player.looksLeft = false;
		}
		player.walkState = (controls["moveLeft"] || controls["moveRight"]);

		if (!player.walkState) player.walkFrame = (controls["crouch"]) ? "_duck" : "_stand";
		if (++player.walkCounter > ((controls["run"]) ? 5 : 9)){
			player.walkCounter = 0;
			if (player.walkState) player.walkFrame = (player.walkFrame === "_walk1") ? "_walk2" : "_walk1";
		}
		player.box.center.x = planets[player.attachedPlanet].box.center.x + Math.sin(planets[player.attachedPlanet].player) * (planets[player.attachedPlanet].box.radius + resources[player.name + player.walkFrame].height / 2);
		player.box.center.y = planets[player.attachedPlanet].box.center.y + Math.cos(planets[player.attachedPlanet].player) * (planets[player.attachedPlanet].box.radius + resources[player.name + player.walkFrame].height / 2);
		player.box.angle = Math.PI - planets[player.attachedPlanet].player;
		player.velX = 0;
		player.velY = 0;
		player.fuel = 300;
	} else {
		fadeBackground(false);		
		
		planets.forEach(function (planet, pi){
			var deltaX = planet.box.center.x - player.box.center.x,
				deltaY = planet.box.center.y - player.box.center.y,
				distPowFour = Math.pow(Math.pow(deltaX, 2) + Math.pow(deltaY, 2), 2);

			player.velX += 9000 * planet.box.radius * deltaX / distPowFour;
			player.velY += 9000 * planet.box.radius * deltaY / distPowFour;

			var origX = player.box.center.x - offsetX,
				origY = player.box.center.y - offsetY;
			if (Math.pow(distPowFour, 1 / 4) < chunkSize) drawArrow(origX, origY, Math.atan2(planet.box.center.x - offsetX - origX, planet.box.center.y - offsetY - origY), 400 / Math.pow(distPowFour, 1 / 4) * planet.box.radius, planet.color);

			if (planet.box.collision(player.box)) {
				//player is in a planet's attraction area
				player.attachedPlanet = pi;
				player.leavePlanet = false;
				planet.player = Math.atan2(deltaX, deltaY) + Math.PI;
			}
		});

		if(controls["jetpack"] > 0 && player.fuel > 0 && controls["crouch"] < 1){
			player.fuel-= controls["jetpack"];
			player.velX += (Math.sin(player.box.angle) / 10) * controls["jetpack"];
			player.velY += (-Math.cos(player.box.angle) / 10) * controls["jetpack"];
		} else if (controls["crouch"] > 0){
			//((player.box.center.x - canvas.width / 2 + (game.dragStartX - game.dragX)) + 19 * offsetX) / 20;
			player.velX = player.velX * 0.987;
			player.velY = player.velY * 0.987;
		}

		var runMultiplicator = controls["run"] ? 1.7 : 1;
		if (controls["moveLeft"] > 0) player.box.angle -= (Math.PI / 140) * controls["moveLeft"] * runMultiplicator;
		if (controls["moveRight"] > 0) player.box.angle += (Math.PI / 140) * controls["moveRight"] * runMultiplicator;

		player.box.center.x += player.velX;
		player.box.center.y += player.velY;
	}

	context.fillText("player.oldChunkX: " + player.oldChunkX, 0, 200);
	context.fillText("player.oldChunkY: " + player.oldChunkY, 0, 250);
	context.fillText("planets.length: " + planets.length, 0,  300);
	drawRotatedImage(resources[player.name + player.walkFrame],
		player.box.center.x - offsetX,
		player.box.center.y - offsetY,
		player.box.angle,
		player.looksLeft);


	//layer 3: HUD / GUI
	context.font = "28px Open Sans";
	context.textAlign = "left";
	context.textBaseline = "hanging";

	context.fillStyle = "#eee";
	context.drawImage(resources[player.name + "_badge"], 8, 18, 32, 32);
	context.fillText(player.playerName, 55, 20); //uppercase looks better

	context.font = "20px Open Sans";
	context.fillText("Health: ", 8, 90);
	for (var i = 0; i < player.health; i++){
		context.drawImage(resources["shield"], 80 + i * 22, 90, 18, 18);
	}
	context.fillText("Fuel: ", 8, 120);
	context.fillStyle = "#f33";
	context.fillRect(80, 126, player.fuel, 8);

	[].forEach.call(document.querySelectorAll("#controls img"), function (element){
		element.setAttribute("style", "opacity: " + (0.3 + controls[element.id] * 0.7));
	});

	window.requestAnimationFrame(loop);
}

Math.map = function(x, in_min, in_max, out_min, out_max) {
	return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
init();
