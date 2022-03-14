exports("registerItem", function(itemName, callbackFunction)
    local callbackEvent = "inventory:use:" .. itemName;
    TriggerEvent("inventory:use:itemRegistration", callbackEvent, itemName)
    AddEventHandler(callbackEvent, callbackFunction)
end)
