var sceneLoaded = false;
var children;

var rotationSpeed = 0.1;

function spin(shape)
{
    shape.rotateX(rotationSpeed);
    shape.rotateY(rotationSpeed);
    shape.rotateZ(rotationSpeed);
}

function sceneControl(sceneNode)
{
    if(!sceneLoaded)
        loadScene();
    
    for(shape in children)
    {
        rotationSpeed *= -1;
        spin(shape);
    }
}

function loadScene(sceneNode)
{
    children = sceneNode.children;
    
    for(child in children)
    {
        if(child.name = "shape")
        {
            shapes.push(child);
        }
    }
    
    sceneLoaded = true;
}