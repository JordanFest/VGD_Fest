var init = true;

var ball;
var light = [];

var invert = 1;
var scale = 2;

var cos;
var sin;

var offset = {
    "x": 3,
    "y": 3,
    "z": 3
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
        
        if(child.name == "sphere")
            ball = child;
        
        if(child.name == "light")
                light.push(child);
        init = false;
    }
    
    cos = Math.cos(elapsedTime);
    sin = Math.sin(elapsedTime);

    for(var i = 0; i < light.length; i++)
    {
        light[i].position.x = (offset.x * sin * scale) * invert;
        light[i].position.y = (offset.y * cos * scale) * invert;
        light[i].position.z = (offset.z * cos * scale) * invert;
        
        if(light.length > 1)
            invert *= -1;
    }
}
