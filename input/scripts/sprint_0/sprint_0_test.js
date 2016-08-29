function sceneControl(sceneNode)
{
	var elapsedTime = getElapsedTime();
	var userData = sceneNode["userData"];

	var children = sceneNode.children;
	//debug("children " + children.length + "\n");
    
    var loader = loader = new THREE.JSONLoader();
    //var energy_star_mesh = "resources/models/energy_star.json";
    var energy_star;
    var energy_ball = [];
    var energy_light = [];
    
    for(var i = 0; i < children.length; i++)
    {
        var child = children[i];
        
        if(child.name == "ball1" || child.name == "ball2")
            energy_ball.push(child);
        
        if(child.name == "star") {
            energy_star = child;
        }
        
        if(child instanceof THREE.PointLight)
        {
            energy_light.push(child);
        }
    }
    
    energy_star.rotateY(0.15);
    
    var y = Math.cos(elapsedTime);
    
    y *= 0.5
    
    energy_star.position.y = y;
    
    var invert = 1;
    
    for(var i = 0; i < energy_ball.length; i++)
    {
        var x = Math.cos(elapsedTime) * invert;
        x = 5*x;

        var yOffset = Math.sin(elapsedTime);
	    yOffset = 2.0*yOffset;
        
        energy_ball[i].position.x = x + 1.5*invert;
        
        
        y = energy_star.position.y;
        
        energy_ball[i].position.y = (y + yOffset) * invert;
        
        
        var z = Math.sin(elapsedTime);
        z *= 2
        
        energy_ball[i].position.z = z * invert;
        
        energy_ball[i].rotateY(0.15);
        energy_ball[i].rotateZ(0.15);
        
        energy_light[i].decay = 2;
        energy_light[i].position = energy_ball[i].position;
        energy_light[i].position.z = energy_ball[i].position.z + 2;
        
        invert *= -1;
    }
    
    energy_light[2].distance = 0.0;
    energy_light[2].position = energy_star.position;
    energy_light[2].position.z = energy_star.position.z + 2;
}
