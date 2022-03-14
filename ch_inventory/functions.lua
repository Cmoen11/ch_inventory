

function loadAnimDict( dict )
    while ( not HasAnimDictLoaded( dict ) ) do
        RequestAnimDict( dict )
        Citizen.Wait( 5 )
    end
end
RegisterNetEvent('randPickupAnim')
AddEventHandler('randPickupAnim', function()
    loadAnimDict('pickup_object')
    TaskPlayAnim(PlayerPedId(),'pickup_object', 'putdown_low',5.0, 1.5, 1.0, 48, 0.0, 0, 0, 0)
    Wait(1000)
    ClearPedSecondaryTask(PlayerPedId())
end)


RegisterNetEvent('pickupAnim')
AddEventHandler('pickupAnim', function()
    loadAnimDict('random@domestic')
    TaskPlayAnim(PlayerPedId(),'random@domestic', 'pickup_low',5.0, 1.5, 1.0, 48, 0.0, 0, 0, 0)
    Wait(1000)
    ClearPedSecondaryTask(PlayerPedId())
end)



Citizen.CreateThread(function()
    while true do
        Wait(5)

        SetPedSuffersCriticalHits(PlayerPedId(), false)
    end
end)