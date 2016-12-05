var sceneLoaded = false;
var children;

var shapes = [];
var rotationSpeed = 0.025;

function spin(shape)
{
    shape.rotateX(rotationSpeed);
    shape.rotateY(rotationSpeed);
    shape.rotateZ(rotationSpeed);
}

function sceneControl(sceneNode)
{
    if(!sceneLoaded)
        loadScene(sceneNode);
    
    var loader = loader = new THREE.JSONLoader();
    
    for(var i = 0; i < shapes.length; i++)
    {
        spin(shapes[i]);
    }
}

function loadScene(sceneNode)
{
    children = sceneNode.children;
    
    for(var i = 0; i < children.length; i++)
    {
        if(children[i].name == "shape")
        {
            shapes.push(children[i]);
        }
    }
    
    sceneLoaded = true;
}