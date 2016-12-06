var sceneLoaded = false;
var children;

var player;
var gun;
var camera;

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
	console.log("updating");
		var a = this.acceleration;
		var dir = this.forward;

		var matrix = new THREE.Matrix4();
		matrix.extractRotation( player.matrix );

		dir = new THREE.Vector3( 0, 0, -1 );
		dir.applyProjection( matrix );
		
		var side = new THREE.Vector3(1, 0, 0);
		side.applyProjection(matrix);
		
		var cmd = this.command;
		console.log("checking keys");
		for(key in pressedKeys)
		{
			
			console.log("pressing keys");
			
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
		
		console.log("done updating");
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
		console.log("equip");
		this.currentWeapon = weapon.controls;
	};
	
	this.fire = function()
	{
		console.log("Pull Trigger");
		
		if(weapon.chambered)
		{
			//weapon.fire();
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
	this.fireSound = "../../../input/sound/gun_fire.wav";
	
	this.animationFrame = [];
	this.currentFrame;
	
	this.fireRate = 0.1;
	this.ammoCapacity = 200;
	this.ammoLoaded = 200;
	
	this.chambered = true;
	
	this.fire = function()
	{
		if(ammoLoaded > 0)
		{
			console.log("Fired");
			this.ammoLoaded--;
			animate(this, this.animationFrame[1]);
			this.chambered = false;
			//setTimeout(this.rechamber, fireRate);
		}
	}
	
	this.rechamber = function()
	{
		console.log("Rechambered");
		animate(this, this.animationFrame[0]);
		this.chambered = true;
	}
}

function animate(target, frame)
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
	
	//player.controls.updatePlayer();
	
    var loader = loader = new THREE.JSONLoader();
	
	console.log("...");

}

//Load Scene
function loadScene(sceneNode)
{
	children = sceneNode.children;
	
	// instantiate a listener
	//var audioListener = new THREE.AudioListener();

	
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
				}
			}
			if(gun != null)
			{
				for(var x = 0; x < gun.children.length; x++)
				{
					if(gun.children[x].name == "gun_frame")
					{
						gun.controls.animationFrame.push(gun.children[x]);
					}
				}
			}
		}
		if(children[i].name == "camera")
		{
			camera = children[i];
		}
	}
	
	// add the listener to the camera
	//camera.add( audioListener );
	
	sceneLoaded = true;
}