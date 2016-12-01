var init = true;
var genLoop = true;

var ball;
var light_l = [];
var light_h = [];
var light_p = [];

var loopSize = 16;

var invert = 1;
var scale = 0.75;
var shift = 5;

var cos;
var sin;

var offset = {
    "x": 1,
    "y": 1,
    "z": 1
}

var currOffset = {
    "x": 0,
    "y": 0,
    "z": 0
}

function sceneControl(sceneNode)
{
	var elapsedTime = getElapsedTime();
	var userData = sceneNode["userData"];

	var children = sceneNode.children;
	//debug("children " + children.length + "\n");
    
    var loader = loader = new THREE.JSONLoader();
    
    if(init)
    for(var i = 0; i < children.length; i++)
    {
        var child = children[i];
        
        if(child.name == "ball") 
        {
           ball = child; 
           sceneNode.remove(child);
        }
        
        if(child.name == "light_l") light_l.push(child);
        if(child.name == "light_h") light_h.push(child);
        if(child.name == "light_p") light_p.push(child);
        
        init = false;
    }
    
    if(genLoop)
    {
        currOffset.x = offset.x;
        currOffset.y = offset.y;

        var newBall;
        var iter = 0;
        
        for(var i = 0; i < loopSize; i++)
        {   
            cos = Math.cos(iter);
            sin = Math.sin(iter);
    
            newBall = new THREE.Mesh(ball.geometry, ball.material);
            sceneNode.add(newBall);
            newBall.position.set(currOffset.x + shift, currOffset.y, 0);
            newBall.castShadow = true;
            newBall.scale.set (0.25, 0.25, 0.25);
            
            currOffset.x -= sin;
            currOffset.y -= cos;

            iter += (2 * 3.14) / (loopSize);
            
            console.log(currOffset.x + ", " + currOffset.y);
        }
        
        genLoop = false;
    }
    
    offset.x = 5;
    offset.y = 5;
    offset.z = 5;
    
    sin = Math.sin(elapsedTime);
    cos = Math.cos(elapsedTime);
    
    light_l[0].position.set(offset.x * scale * sin, offset.y * scale * cos, 5);
    light_l[1].position.set(offset.x * scale * sin * -1, offset.y * scale * cos * -1, 5);
    light_p[0].position.set(2.5 - sin * 1/scale, 2.5 - cos * 1/scale, offset.z * (cos * scale))
}
