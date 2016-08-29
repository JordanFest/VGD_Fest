function sceneControl(sceneNode)
{
	var elapsedTime = getElapsedTime();
	var userData = sceneNode["userData"];

	var children = sceneNode.children;
	//debug("children " + children.length + "\n");
    
    var paddleSpeed = 0.15;
    
    for(var i = 0; i < children.length; i++)
    {
        if(children[i].name == "paddle_l")
            paddle_l = children[i];
        if(children[i].name == "paddle_r")
            paddle_r = children[i];
        if(children[i].name == "pong")
            pong = children[i];
        if(children[i].name == "paddle_col_l")
            paddle_col_l = children[i];
       if(children[i].name == "paddle_col_r")
            paddle_col_r = children[i];
    }
    
    for(var key in pressedKeys)
    {
        if(pressedKeys.hasOwnProperty(key) && pressedKeys[key] == true)
        {
            if(key == 87 && paddle_l.position.y < yBound)
                paddle_l.position.y += paddleSpeed;
            
            if(key == 83 && paddle_l.position.y > -yBound)
                paddle_l.position.y -= paddleSpeed;
            
            
            if(key == 38 && paddle_r.position.y < yBound)
                paddle_r.position.y += paddleSpeed;
            
            if(key == 40 && paddle_r.position.y > -yBound)
                paddle_r.position.y -= paddleSpeed;           
        }
    }
    
    if(newGame)
    {   
        pongBall.releasePong();
        newGame = false;
    }
    
    pongBall.updatePosition();
    
}