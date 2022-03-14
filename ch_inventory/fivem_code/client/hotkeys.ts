import * as Cfx from "fivem-js";

const keys: number[] = [157, 158, 160, 164];
let lastHotkeyPressed = new Date();

setTick(() => {
	keys.forEach((key, index) => {
		if (Cfx.Game.isDisabledControlJustPressed(0, key)) {
			if (new Date().getTime() - lastHotkeyPressed.getTime() < 1000) {
				return;
			}
			lastHotkeyPressed = new Date();
			emitNet("inventory:hotkeyUse", index + 1);
		}
	});

	if (IsDisabledControlJustReleased(0, 37)) {
		SendNuiMessage(
			JSON.stringify({
				app: "inventory",
				method: "setHotbarVisible",
				data: false,
			})
		);
	}
	if (IsDisabledControlJustPressed(0, 37)) {
		SendNuiMessage(
			JSON.stringify({
				app: "inventory",
				method: "setHotbarVisible",
				data: true,
			})
		);
	}
});

setTick(() => {
	HudWeaponWheelIgnoreSelection();
	HideHudComponentThisFrame(19);
	HideHudComponentThisFrame(20);
	HideHudComponentThisFrame(17);
	DisableControlAction(0, 37, true);
});
