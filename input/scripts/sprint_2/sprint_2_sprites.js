var sceneLoaded = false;
var children;

var spawnLimit = 25;

var ballBase;

var ballCollection = [];
var ballIndex = 0;

var scene;

function ball() {
    this.velocity = new THREE.Vector3(0, 0, 0);

    this.recentBounce = false;
    
    this.addVelocity = function(x, y)
    {
        this.velocity = new THREE.Vector3(this.velocity.x + x, this.velocity.y + y, 0);
    }

    this.bounce = function (x, y)
    {
        if(x == true)
            this.velocity.x *= -1;
        if(y == true)
            this.velocity.y *= -1;
    }

    this.updatePosition = function (currentPosition)
    {
        currentPosition.x += this.velocity.x;
        currentPosition.y += this.velocity.y;
    }
}

var boundaries = [];

function boundary()
{

    this.collisionX = function (self)
    {
        if (self.geometry.parameters.width > 1)
            return true;
        return false;
    }

    this.collisionY = function (self) {
        if (self.geometry.parameters.height > 1)
            return true;
        return false;
    }

    this.collides = function(self, object)
    {
        var wallWidth = self.geometry.parameters.width;
        var wallHeight = self.geometry.parameters.height;
        var wallPos = self.position;

        var objectSize = 1;
        var objectPos = object.position;

        var distance =  Math.sqrt(Math.pow((wallPos.x - objectPos.x),2) + Math.pow((wallPos.y - objectPos.y),2));
        var spaceWidth = wallWidth + objectSize;
        var spaceHeight = wallHeight + objectSize;

        if (spaceWidth > distance || spaceHeight > distance)
            return true;

        return false;
    }
}

function sceneControl(sceneNode)
{
    if(!sceneLoaded) loadScene(sceneNode);
    
    var loader = loader = new THREE.JSONLoader();

    if (ballCollection.length < spawnLimit)
        spawnBall();

    updateBallScene();
}

function loadScene(sceneNode)
{
    children = sceneNode.children;
    
    for(var i = 0; i < children.length; i++)
    {
        if(children[i].name == "ball")
        {
            ballBase = children[i].clone();
            ballBase.position.set(0, 0, 0);
            children[i].visible = false;
        }

        if(children[i].name == "wall")
        {
            children[i].object = new boundary();
            boundaries.push(children[i]);
        }
    }
    
    scene = sceneNode

    sceneLoaded = true;
}

function spawnBall()
{
    var newBall = ballBase.clone();
    newBall.object = new ball();
    var xFlip = 1;
    var yFlip = 1;

    Math.random() < 0.5 ? xFlip = -1 : xFlip = 1;
    Math.random() < 0.5 ? yFlip = -1 : yFlip = 1;

    newBall.object.addVelocity(Math.random() * 0.05 * xFlip, Math.random() * 0.05 * yFlip);

    ballCollection.push(newBall);

    var color = new THREE.Color(Math.random(), Math.random(), Math.random());

    var material = newBall.material.clone();

    material.color = color;

    newBall.material = material;

    scene.add(ballCollection[ballCollection.length - 1]);
}

function updateBallScene()
{
    var ball;

    for (var i = 0; i < ballCollection.length; i++)
    {

        ball = ballCollection[i];

        for (var x = 0; x < boundaries.length; x++)
        {
            self = boundaries[x];

            ball.object.bounce(self.object.collisionX(self), self.object.collisionY(self));
            if (boundaries[x].object.collides(self, ball))
                ball.object.bounce(self.object.collisionX(self), self.object.collisionY(self));
        }
        ball.object.updatePosition(ball.position);
    }
}