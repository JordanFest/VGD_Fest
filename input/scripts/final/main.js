var sceneLoaded = false;
var children;
var scene;

var player;
var gun;
var camera;

var enemies = [];
var enemiesLeft = [];

var targetAmount = 10;

rendererContainer.autoClear = false;

//Controls
var playerControls = function()
{
	this.forward = new THREE.Vector3(0.0, 0.0, -1.0);
	this.right = new THREE.Vector3(1.0, 0.0, 0.0);
	this.velocity = new THREE.Vector3(0.0, 0.0, 0.0);
	
	this.speed = 15;
	this.acceleration = 0.75;
	this.friction = 0.5;
	this.rotSpeed = 0.035;
	
	this.currentWeapon;
	
	this.updatePlayer = function()
	{	
		var a = this.acceleration;
		var dir = this.forward;

		var matrix = new THREE.Matrix4();
		matrix.extractRotation( player.matrix );

		dir = new THREE.Vector3( 0, 0, -1 );
		dir.applyProjection( matrix );
		
		var side = new THREE.Vector3(1, 0, 0);
		side.applyProjection(matrix);
		
		var cmd = this.command;
		for(key in pressedKeys)
		{
			
			if(key == cmd["forward"])
				this.addVelocity(a * dir.x, 0, a * dir.z);
			if(key == cmd["backward"])
				this.addVelocity(-a * dir.x, 0, -a * dir.z);
			if(key == cmd["strafeRight"])
				this.addVelocity(a * side.x, 0, a * side.z);
			if(key == cmd["strafeLeft"])
				this.addVelocity(-a * side.x, 0, -a * side.z);
			
			if(key == cmd["fire"])
				this.fire();
			
			if(key == cmd["turnRight"])
				player.rotateY(-this.rotSpeed);
			if(key == cmd["turnLeft"])
				player.rotateY(this.rotSpeed);
		}
		
		player.position.x += this.velocity.x;
		player.position.y += this.velocity.y;
		player.position.z += this.velocity.z;
		
		if(Math.abs(this.velocity.x) <= 0.0001)
			this.velocity.x = 0.0;
		else
			this.velocity.x *= this.friction;
		
		if(Math.abs(this.velocity.y) <= 0.0001)
			this.velocity.y = 0.0;
		else
			this.velocity.y *= this.friction;
		
		if(Math.abs(this.velocity.z) <= 0.0001)
			this.velocity.z = 0.0;
		else
			this.velocity.z *= this.friction;
		
	};
	
	this.addVelocity = function(x, y, z)
	{
		var v = this.velocity;
		var speed = this.speed;
		
		if(speed > v.x + x && -speed < v.x + x)
			v.x += x;
		else if(speed < v.x + x)
			v.x = speed;
		else
			v.x = -speed;
		
		if(speed > v.y + y && -speed < v.y + y)
			v.y += y;
		else if(speed < v.y + y)
			v.y = speed;
		else
			v.y = -speed;
		
		if(speed > v.z + z && -speed < v.z + z)
			v.z += z;
		else if(speed < v.z + z)
			v.z = speed;
		else
			v.z = -speed;
		
		this.velocity.normalize() * speed;
	};
	
	this.equipWeapon = function(weapon)
	{
		this.currentWeapon = weapon.controls;
	};
	
	this.fire = function()
	{
		if(this.currentWeapon.chambered)
		{
			this.currentWeapon.fire();
		}
	};
	
	this.command = {
		"fire":        32, //space
		"forward":     87, //w
		"strafeLeft":  65, //a
		"backward":    83, //s
		"strafeRight": 68, //d
		"turnLeft":    37, //Left Arrow
		"turnRight":   39, //Right Arrow
	};
}

var gunControls = function()
{
	this.fireSoundSource = ["../input/sound/gun_fire.ogg"];
	this.fireSound;
	
	this.dryFireSoundSource = ["../input/sound/gun_dryfire.ogg"];
	this.dryFireSound;
	
	this.animationFrame = [];
	this.currentFrame;
	
	this.fireRate = 0.1;
	this.ammoCapacity = 20;
	this.ammoLoaded = 20;
	
	this.chambered = true;
	
	this.coolDownTimer;
	
	this.fire = function()
	{
		if(this.ammoLoaded > 0 && this.chambered)
		{
			this.ammoLoaded--;
			
			this.fireSound.play();
			gun.controls.fireSound = new Sound(gun.controls.fireSoundSource, 1, 1);
			
			animateObject(this, this.animationFrame[1]);
			this.chambered = false;
			this.coolDownTimer = new THREE.Clock();
			this.coolDownTimer.start();
			
		} else if(this.coolDownTimer != null && this.coolDownTimer.getElapsedTime() > this.fireRate && this.ammoLoaded <= 0)
		{
			this.dryFireSound.play();
			gun.controls.dryFireSound = new Sound(gun.controls.dryFireSoundSource, 1, 1);
			animateObject(this, this.animationFrame[0]);
			this.coolDownTimer = new THREE.Clock();
			this.coolDownTimer.start();
		}
	}
	
	this.rechamber = function()
	{
		if(this.animationFrame != null)
		{
			animateObject(this, this.animationFrame[0]);
			this.chambered = true;
		}
	}
	
	this.updateGun = function()
	{
		if(this.coolDownTimer != null && this.coolDownTimer.getElapsedTime() >= this.fireRate)
		{
			this.rechamber();
		}
	}
}

var enemyControls = function(name, health)
{
	this.name = name;
	this.health = health;
	this.dead = false;
	
	this.id;
	
	this.positionOffet = 1.5;
	
	this.animationFrame = [];
	this.currentFrame;
	this.currentAnimationFrame = 0;
	
	this.deathAnimationFrameOffset = 0;
	this.deathAnimationCount = 2;
	
	this.animationTimer;
	this.frameTime = 0.35;
	
	this.damage = function(damage)
	{
		(health - damage < 0) ? 0 : health - damage;
	}
	
	this.die = function()
	{
		if(!this.dead)
		{
			this.dead = true;
			
			currentAnimationFrame++;
			if(this.currentAnimationFrame <= this.deathAnimationCount)
			{
				animateObject(this, this.animationFrame[deathAnimationFrameOffset + currentAnimationFrame])
			}
		}
	}
	
	this.updateEnemy = function()
	{
		if(health <= 0)
			this.die();
	}
}

function spawnEnemy(enemy, position)
{

	var counter = 0;
	
	if(enemy != null)
	{
		var spawn = enemy.clone();
		spawn.controls = enemy.controls;
		
		spawn.position.x = position.x;
		spawn.position.y = position.y + spawn.positionOffet;
		spawn.position.z = position.z;
		spawn.visible = true;
		
		scene.add(spawn);
		
		enemiesLeft.push(spawn);
	}
}

 function animateObject(target, frame)
 {
	if(target.animationFrame != null && frame != null)
	{
	  target.currentFrame.visible = false;
	  target.currentFrame = frame;
	  target.currentFrame.visible = true;	
	}
 }

//Scene Control
function sceneControl(sceneNode)
{
    if(!sceneLoaded)
        loadScene(sceneNode);
	
	player.controls.updatePlayer();
	gun.controls.updateGun();
	
    var loader = loader = new THREE.JSONLoader();
}

//Load Scene
function loadScene(sceneNode)
{
	scene = sceneNode;
	children = sceneNode.children;
	
	// instantiate a listener
	var audioListener = new THREE.AudioListener();

	
	for(var i = 0; i < children.length; i++)
	{
		if(children[i].name == "player")
		{
			player = children[i];
			player.controls = new playerControls();
		}
		if(player != null && gun == null)
		{
			for(var x = 0; x < player.children.length; x++)
			{
				if(player.children[x].name == "gun")
				{
					gun = player.children[x];
					gun.controls = new gunControls();
					gun.controls.fireSound = new Sound(gun.controls.fireSoundSource, 1, 1);
					gun.controls.dryFireSound = new Sound(gun.controls.dryFireSoundSource, 1, 1);
					player.controls.equipWeapon(gun);
				}
			}
			if(gun != null)
			{
				for(var x = 0; x < gun.children.length; x++)
				{
					if(gun.children[x].name == "gun_frame")
					{
						if(gun.children[x].visible == true)
							gun.controls.currentFrame = gun.children[x];
						
						gun.controls.animationFrame.push(gun.children[x]);
					}
				}
			}
		}
		if(children[i].name == "targetEnemy")
		{	
			enemies["Target"] = children[i];
			
			enemies["Target"].controls = new enemyControls("Target", 1);
			
			enemy = enemies["Target"];
			
			for(var x = 0; x < enemy.children.length; x++)
			{
				if(enemy.children[x].name == "target_frame")
				{
					if(enemy.children[x].visible == true)
						enemy.controls.currentFrame = enemy.children[x];
					enemy.controls.animationFrame.push(enemy.children[x]);
				}
			}
		}
		if(children[i].name == "camera")
		{
			camera = children[i];
			camera.far = 1000;
		}
	}
	
	// add the listener to the camera
	//camera.add( audioListener );
	
	populateTargets();
	
	//console.log("Enemy Listing");
	//console.log(enemies);
	console.log("Current enemies");
	console.log(enemiesLeft);
	
	sceneLoaded = true;
}

function populateTargets()
{
	for(enemy in enemies)
	{
		if(enemies[enemy] == enemies["Target"])
		{
			for(var i = 0; i < targetAmount; i++)
				spawnEnemy(enemies[enemy], new THREE.Vector3((Math.random() * 20) + 1, 0, (Math.random() * 20) + 1));
		}
	}
	
	console.log("Done");
}

//https://threejsdoc.appspot.com/doc/three.js/examples.source/misc_sound.html.html
var Sound = function ( sources, radius, volume ) {

	var audio = document.createElement( 'audio' );

	for ( var i = 0; i < sources.length; i ++ ) {

		var source = document.createElement( 'source' );
		source.src = sources[ i ];

		audio.appendChild( source );

	}

	this.position = new THREE.Vector3();

	this.play = function () {

		audio.play();

	}

	this.update = function ( camera ) {

		var distance = this.position.distanceTo( camera.position );

		if ( distance <= radius ) {

			audio.volume = volume * ( 1 - distance / radius );

		} else {

			audio.volume = 0;

		}

	}

}