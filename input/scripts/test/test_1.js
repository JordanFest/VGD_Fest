var hasRun = false;

function sceneControl(sceneNode)
{
    if(!hasRun)
    {
        hasRun = true;
        debug("Has Loaded (1)");
        addScene("/input/scenes/test_2.json");
    }
}