var sceneLoaded = false;
var children;
var scene;

var player;
var gun;
var mgBullet;
var camera;

var collisionDistance = 12.5;

var enemies = [];
var enemiesLeft = [];

var currentProjectiles = [];

var targetAmount = 20;

var collidableMeshList = [];

var arenaDemension = 20;
var wallSection = [];

rendererContainer.autoClear = false;

//Controls
var playerControls = function()
{
	this.forward = new THREE.Vector3(0.0, 0.0, -1.0);
	this.right = new THREE.Vector3(1.0, 0.0, 0.0);
	this.velocity = new THREE.Vector3(0.0, 0.0, 0.0);
	
	this.speed = 15;
	this.acceleration = 0.5;
	this.friction = 0.5;
	this.rotSpeed = 0.025;
	
	this.canGoForward = true;
	this.canGoBackward = true;
	this.canGoLeft = true;
	this.canGoRight = true;
	
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
		
		collisionCheck(player);
		
		var cmd = this.command;
		for(key in pressedKeys)
		{	
			if(key == cmd["forward"] && this.canGoForward)
				this.addVelocity(a * dir.x, 0, a * dir.z);
			if(key == cmd["backward"] && this.canGoBackward)
				this.addVelocity(-a * dir.x, 0, -a * dir.z);
			if(key == cmd["strafeRight"] && this.canGoRight)
				this.addVelocity(a * side.x, 0, a * side.z);
			if(key == cmd["strafeLeft"] && this.canGoLeft)
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
		
		matrix.makeRotationFromQuaternion(player.quaternion);
		player.collisionBox.quaternion.setFromRotationMatrix(matrix);
		
		player.collisionBox.position.x = player.position.x;
		player.collisionBox.position.y = player.position.y;
		player.collisionBox.position.z = player.position.z;
		
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
	this.ammoCapacity = 50;
	this.ammoLoaded = 50;
	
	this.chambered = true;
	
	this.bullet;
	
	this.coolDownTimer;
	
	this.fire = function()
	{
		if(this.ammoLoaded > 0 && this.chambered)
		{
			this.ammoLoaded--;
			spawnProjectile(this.bullet, player);
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

var bulletControls = function()
{
	this.bulletSpeed = 12;
	this.damage = 3.35;
	
	this.spawnOrigin;
	this.isDeleted = false;
	
	this.forward = new THREE.Vector3(0.0, 0.0, -1.0);
	
	this.lifeTime = 2;
	this.lifeTimer;

	this.updateProjectile = function()
	{
		var matrix = new THREE.Matrix4();
		matrix.extractRotation(this.spawnOrigin.matrix)
		if(this.lifeTimer == null)
		{
			this.lifeTimer = new THREE.Clock();
			this.lifeTimer.start();			
		}
		if(this.lifeTimer != null && this.lifeTimer.getElapsedTime() >= this.lifeTime)
		{
			for(var i = currentProjectiles.length - 1; i >= 0; i--)
			{
				if(currentProjectiles[i].uuid == this.spawnOrigin.uuid)
				{
					this.spawnOrigin.isDeleted = true;
					scene.remove(this.spawnOrigin.collisionBox);
					scene.remove(this);
				}
			}
		}
		this.spawnOrigin.position.x += this.forward.x * this.bulletSpeed;
		this.spawnOrigin.position.y += this.forward.y * this.bulletSpeed;
		this.spawnOrigin.position.z += this.forward.z * this.bulletSpeed;
		this.spawnOrigin.collisionBox.position.x = this.spawnOrigin.position.x;
		this.spawnOrigin.collisionBox.position.y = this.spawnOrigin.position.y;
		this.spawnOrigin.collisionBox.position.z = this.spawnOrigin.position.z;
	}
}

var enemyControls = function(name, health)
{
	this.name = name;
	this.health = health;
	this.dead = false;
	this.isAnimating = false;
	
	this.originPoint;
	
	this.positionOffset = 1.5;
	
	this.animationFrame = [];
	this.currentFrame;
	this.currentAnimationFrame = 0;
	this.deathAnimationFrameCap = 2;
	
	this.frameTime = 5;
	this.animationTimer;

	this.damage = function(damage)
	{
		health = (health - damage < 0) ? 0 : health - damage;
	}
	
	this.die = function()
	{
		if(!this.dead)
		{
			this.dead = true;
			
			this.currentFrame.visible = false;
			
			if(this.animationTimer == null)
			{
				this.animationTimer = new THREE.Clock()
				//this.animationTimer.start()
				//this.isAnimating = true;
			}
		}
	}
	
	this.updateEnemy = function()
	{
		if(health <= 0)
		{
			this.die();
		}
		
		// if(this.isAnimating && this.dead)
		// {
			// if(this.animationTimer.getElapsedTime() > this.frameTime)
			// {
				// this.animationTimer = new THREE.Clock();
				// this.animationTimer.start();
			// } else if(this.animationTimer.getElapsedTime() <= this.frameTime && this.currentAnimationFrame <= this.deathAnimationFrameCap){
				// this.currentAnimationFrame++;
				// animateObject(this, this.animationFrame[this.currentAnimationFrame]);
			// } else {
				// this.isAnimating = false;
			// }
		// }
	}
}

function destroy(object)
{
	scene.remove(object);
}

function spawnProjectile(projectile, origin)
{
	if(projectile != null && origin != null)
	{
		var spawn = projectile.clone();
		spawn.controls = new bulletControls();
		
		spawn.position.x = origin.position.x;
		spawn.position.y = origin.position.y - 1;
		spawn.position.z = origin.position.z;

		var matrix = new THREE.Matrix4();
		matrix.extractRotation(origin.matrix);
		
		spawn.controls.forward.applyProjection(matrix);
		
		scene.add(spawn);
		
		spawn.visible = true;
		
		generateCollision(spawn);
		
		currentProjectiles.push(spawn);
		spawn.controls.spawnOrigin = currentProjectiles[currentProjectiles.length - 1];
	}
}

function spawnEnemy(enemy, position)
{
	var counter = 0;
    
    if(position.x == null) position.x = 0;
    if(position.y == null) position.y = 0;
    if(position.z == null) position.z = 0;
    
	if(enemy != null)
	{
		var spawn = enemy.clone();
		spawn.controls = new enemyControls(enemy.name, enemy.controls.health);
		
		spawn.position.x = position.x;
		spawn.position.y = position.y + spawn.controls.positionOffset;
		spawn.position.z = position.z;
	
		spawn.controls.currentFrame = enemy.controls.currentFrame.clone();
		spawn.controls.animationFrame = [];
		for(var i = 0; i < enemy.controls.animationFrame.length; i++)
		{
			spawn.controls.animationFrame.push(enemy.controls.animationFrame[i].clone());
			spawn.controls.animationFrame[spawn.controls.animationFrame.length-1].position.x = spawn.position.x;
			spawn.controls.animationFrame[spawn.controls.animationFrame.length-1].position.y = spawn.position.y;
			spawn.controls.animationFrame[spawn.controls.animationFrame.length-1].position.z = spawn.position.z;
		}
		spawn.visible = true;
		
		scene.add(spawn);
        
		generateCollision(spawn);
		
		enemiesLeft.push(spawn);
		
		spawn.controls.originPoint = spawn;
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

 function generateCollision(object)
 {
	var g;
	
	for(var x = 0; x < object.children.length; x++)
		if(object.children[x].name == "col")
			g = object.children[x].geometry;
	 
	var colBox = new THREE.CubeGeometry(g.parameters.width, g.parameters.height, g.parameters.depth, 1, 1, 1);
	//var colMat = new THREE.MeshBasicMaterial({color: new THREE.Color(object.material.color.r, object.material.color.g, object.material.color.b), wireframe: object.material.wireframe});
	var colMat = new THREE.MeshBasicMaterial({color: new THREE.Color(0x0000ff), wireframe: true});
	var colObject = new THREE.Mesh(colBox, colMat);
	scene.add(colObject);
	
	object.collisionBox = colObject;
	object.collisionBox.name = "col";
	
	object.collisionBox.position.x = object.position.x;
	object.collisionBox.position.y = object.position.y;
	object.collisionBox.position.z = object.position.z;
	
	//object.col.geometry.visible = true;
	
	collidableMeshList.push(object);
 }
 
 function collisionCheck(object)
 {
	var originPoint = object.collisionBox.position.clone();
	 
	//http://stackoverflow.com/questions/11473755/how-to-detect-collision-in-three-js
	for (var vertexIndex = 0; vertexIndex < object.collisionBox.geometry.vertices.length; vertexIndex++)
	{       
		var localVertex = object.collisionBox.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4( object.collisionBox.matrix );
		var directionVector = globalVertex.sub( object.collisionBox.position );
		
		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
		
		var collisionResults = ray.intersectObjects( scene.children, true );
				
		if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
		{
			//if(collisionResults[0].object.name == "gun_frame")
				//collisionResults.pop(collisionResults[0]);
			if(collisionResults != null && collisionResults.length > 0)
			{
				if(object.name == "player")
				{
					for(var i = 0; i < collisionResults.length; i++)
					{
						if(collisionResults[i].object.name == "col" && collisionResults[i].distance < collisionDistance)
						{
							if(collisionResults[i].point.x - object.position.x > 0.0)
							{
								object.controls.canGoForward = false;
								if(object.controls.velocity.x > 0.0)
								{
									object.controls.velocity.x = 0.0;
								}
							}
							
							if((collisionResults[i].point.x - object.position.x < 0.0))
							{
								object.controls.canGoBackward = false;
								if(object.controls.velocity.x < 0.0)
								{
									object.controls.velocity.x = 0.0;
								}
							}
							
							if(collisionResults[i].point.z - object.position.z > 0.0)
							{
								object.controls.canGoRight = false;
								if(object.controls.velocity.z > 0.0)
								{
									object.controls.velocity.z = 0.0;
								}
							}
							
							if(collisionResults[i].point.z - object.position.z < 0.0)
							{
								object.controls.canGoLeft = false;
								if(object.controls.velocity.z < 0.0)
								{
									object.controls.velocity.z = 0.0;
								}
							}
						}
					}
				} else if (object.name == "bullet")
				{
					for(var x = 0; x < collisionResults.length; x++)
					{
						if(collisionResults[x].object.uuid != object.collisionBox.uuid && collisionResults[x].object.name == "col"  && collisionResults[x].distance < collisionDistance)
						{
							if(collisionResults[x].object.uuid != player.collisionBox.uuid)
							{
								for(var y = 0; y < enemiesLeft.length; y++)
								{
									if(enemiesLeft[y].collisionBox.uuid == collisionResults[x].object.uuid)
									{
										enemiesLeft[y].controls.damage(object.controls.damage);
									}
								}
								object.controls.lifeTime = 0;
							}
						}
					}
				}
			}
		} else {
			if(object.name == "player" && collisionResults.length == 0)
			{
				object.controls.canGoForward = true;
				object.controls.canGoBackward = true;
				object.controls.canGoRight = true;
				object.controls.canGoLeft = true;
			}
		}
	}
 }
 
//Scene Control
function sceneControl(sceneNode)
{
    if(!sceneLoaded)
        loadScene(sceneNode);
	
	player.controls.updatePlayer();
	gun.controls.updateGun();
	
	if(currentProjectiles != null && currentProjectiles.length > 0)
	{
		for(var i = 0; i < currentProjectiles.length; i++)
		{
			if(!currentProjectiles[i].isDeleted)
			{
				currentProjectiles[i].controls.updateProjectile();
				collisionCheck(currentProjectiles[i]);
			}
		}
	}
	
	for(var i = 0; i < enemiesLeft.length; i++)
	{
		enemiesLeft[i].controls.updateEnemy();
		
		if(enemiesLeft[i].controls.dead)
		{
			scene.remove(enemiesLeft[i].collisionBox);
			enemiesLeft[i].visible = false;
			console.log(enemiesLeft[i]);
			animateObject(enemiesLeft[i].controls, enemiesLeft[i].controls.animationFrame[2]);
			for(var x = 0; x < enemiesLeft[i].children; x++)
			{
				if(enemiesLeft[i].children[x].name == "target_frame")
				{
					if(enemiesLeft[i].children[x].visible == true)
						scene.remove(enemiesLeft[i].children[x]);
				}
			}
		}
	}

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
                if(camera == null)
                {
                    if(player.children[x].name == "camera")
                    {
                        camera = children[x];
                        camera.far = 1000;
                    }
                }
				if(player.children[x].name == "colPlayer")
				{
					player.col = player.children[x];
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
		if(gun != null && children[i].name == "bullet")
		{
			mgBullet = children[i];
			mgBullet.controls = new bulletControls();
			gun.controls.bullet = mgBullet;
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
		if(children[i].name == "wall")
		{
			wallSection.push(children[i]);
		}
		for(var x = 0; x < children[i].children.length; x++)
		{
			var object = children[i].children[x];
			
			if(object.name == "col" && children[i] != null && children[i].name == "player")
			{
				generateCollision(children[i]);
			}
		}
	}
	
	// add the listener to the camera
	//camera.add( audioListener );

	generateArena();
	
	populateTargets();
	
	//console.log("Enemy Listing");
	//console.log(enemies);

	sceneLoaded = true;
}

function generateArena()
{
	var offset = 100;
	var block;
	
	var copy = wallSection[0];
	
	console.log("Generating Arena");
	for(var x = offset; x >= -offset;)
	{
		copy.position.z = offset;
		
		copy.position.x = x;
		block = wallSection[0].clone();
		generateCollision(block);
		scene.add(block);
		
		copy.position.z = -offset;
		
		copy.position.x = -x;
		block = wallSection[0].clone();
		generateCollision(block);
		scene.add(block);
		
		x -= 10;
	}
	
	copy.position.x = offset;
	
	for(var z = offset; z >= -offset;)
	{
		copy.position.x = offset;
		
		copy.position.z = z;
		block = wallSection[0].clone();
		generateCollision(block);
		scene.add(block);
		
		copy.position.x = -offset;
		
		copy.position.z = -z;
		block = wallSection[0].clone();
		generateCollision(block);
		scene.add(block);
		
		z -= 10;
	}
	
	console.log("Done");
}

function populateTargets()
{
	for(enemy in enemies)
	{
		if(enemies[enemy] == enemies["Target"])
		{
			for(var i = 0; i < targetAmount; i++)
				spawnEnemy(enemies[enemy], new THREE.Vector3((Math.random() * 200) - 99, 0.0, (Math.random() * 200) - 99));
		}
	}
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