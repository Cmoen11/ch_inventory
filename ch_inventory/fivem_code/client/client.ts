import * as Cfx from "fivem-js";
import * as types from "@shared/types";
import _ from "lodash";
import "./Slot/SlotInUse";
import "./hotkeys";
import "./shops";
import "./craftingStations";
import "./drops";
import "./Slot/SlotInUse";
import "./trunk";
import SlotInUse from "./Slot/SlotInUse";

let inventoryOpen: boolean = false;
let insideDropZone: string | undefined = undefined;
export const Delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export let ItemData: types.ItemDataHashMap = {};

let OpenedSecInventory:
	| {
			owner: string;
			type: types.InventoryTypes;
	  }
	| undefined = undefined;

function openSecoundInventory(invType: types.InventoryTypes, owner: string, slots: number, weight: number) {
	emitNet("inventory:openInventory", invType, owner, slots, weight);
}

async function openInventory() {
	const playerPed = Cfx.Game.PlayerPed;

	if (playerPed?.LastVehicle && playerPed?.isInVehicle(playerPed?.LastVehicle)) {
		const numberplate = playerPed?.LastVehicle.NumberPlate;
		openSecoundInventory("glovebox", numberplate, 5, 50);
		return;
	}

	if (_.isNil(insideDropZone)) {
		const [playerX, playerY, playerZ] = GetEntityCoords(GetPlayerPed(-1), true);
		emit("randPickupAnim");
		openSecoundInventory("drop", `1_${playerX.toFixed(2)}_${playerY.toFixed(2)}_${playerZ.toFixed(2)}`, 100, 500);
	} else {
		const [owner, x, y, z] = insideDropZone.split("_");
		emit("pickupAnim");
		openSecoundInventory("drop", `${owner}_${x}_${y}_${z}`, 100, 500);
	}
}

function open(inventories: { playerInventory: types.IInventory; secoundInventory: types.IInventory }) {
    OpenedSecInventory = {
		owner: inventories.secoundInventory.owner,
		type: inventories.secoundInventory.type,
	};

	SendNuiMessage(
		JSON.stringify({
			app: "inventory",
			method: "setPlayerInventory",
			data: inventories.playerInventory,
		})
	);
	SendNuiMessage(
		JSON.stringify({
			app: "inventory",
			method: "setSecoundInventory",
			data: inventories.secoundInventory,
		})
	);
	SendNuiMessage(
		JSON.stringify({
			app: "REACTNUI",
			method: "setVisibility",
			data: true,
		})
	);
	TriggerScreenblurFadeIn(400);
	SetNuiFocus(true, true);
	// SetNuiFocusKeepInput(true);
	inventoryOpen = true;
}

onNet("inventory:openInventory", open);

onNet("inventory:allowMove", () => {
	SendNuiMessage(
		JSON.stringify({
			app: "inventory",
			method: "setAllowMove",
			data: true,
		})
	);
});

onNet("inventory:addSlotEvent", (slotEvent: types.SlotEvent) => {
	SendNuiMessage(
		JSON.stringify({
			app: "SlotEvent",
			method: "addSlotEvent",
			data: slotEvent,
		})
	);
});

onNet("inventory:updateItemData", (itemData: types.ItemDataHashMap) => {
	ItemData = itemData;
	SendNuiMessage(
		JSON.stringify({
			app: "inventory",
			method: "setItemData",
			data: itemData,
		})
	);
});

onNet("inventory:updatePlayerInventory", (inventory: types.IInventory) => {
	SendNuiMessage(
		JSON.stringify({
			app: "inventory",
			method: "setPlayerInventory",
			data: inventory,
		})
	);
});

onNet("inventory:updateSecoundInventory", (inventory: types.IInventory) => {
	OpenedSecInventory = {
		owner: inventory.owner,
		type: inventory.type,
	};
	SendNuiMessage(
		JSON.stringify({
			app: "inventory",
			method: "setSecoundInventory",
			data: inventory,
		})
	);
});

onNet("inventory:updateNearbyPlayers", (players: types.NearbyPlayer) => {
	SendNuiMessage(
		JSON.stringify({
			app: "inventory",
			method: "setNearbyPlayers",
			data: players,
		})
	);
});

RegisterRawNuiCallback("getNearbyPlayers", (data: any) => {
	emitNet("inventory:getNeabyPlayers");
});

RegisterRawNuiCallback("giveItem", function (_data: any) {
	const data: { playerId: string; slot: types.ISlot } = JSON.parse(_data.body);
	emitNet("inventory:giveItem", data.playerId, data.slot);
});

on("inventory:insideDropZone", function (zone: string) {
	insideDropZone = zone;
});
on("inventory:isOutsideDropZone", function () {
	insideDropZone = undefined;
});
// onNet("inventory:useWeapon", (slot: types.ISlot) => {
// 	SlotInUse.getInstance().useWeaponItem(slot);
// });

// onNet("inventory:reloadWeapon", SlotInUse.getInstance().reloadWeapon);

onNet("inventory:updateBalance", (balance: number) => {
	SendNuiMessage(
		JSON.stringify({
			app: "inventory",
			method: "setBalance",
			data: balance,
		})
	);
});

RegisterRawNuiCallback("updateItemData", (data: any) => {
	emitNet("inventory:updateItemData");
});

RegisterRawNuiCallback("moveItem", async (data: any) => {
	// _fromSlot: types.ISlot, _toSlot: types.ISlot, count: number
	// const { fromSlot, toSlot, count } = JSON.parse(data);

	const _data: any = JSON.parse(data?.body);
	const fromSlot: types.ISlot = _data.fromSlot;
	const toSlot: types.ISlot = _data.toSlot;

	const slotInUse = SlotInUse.getInstance().slotInUse;
	// todo: fix this

	if (
		(slotInUse?.slotNumber === fromSlot?.slotNumber && fromSlot.inventory === "player") ||
		(slotInUse?.slotNumber === toSlot?.slotNumber && toSlot.inventory === "player")
	) {
		// slot that are beeing moved is in use.
		emit("inventory:holsterWeapon");
		await Delay(500);
		//SlotInUse.getInstance().holsterWeapon();
	}

	emitNet("inventory:moveItem", JSON.parse(data?.body));
});

RegisterRawNuiCallback("useItem", function (_data: any) {
	const data: types.ISlot = JSON.parse(_data?.body);
	if (_.first(data.items).name == "bag") {
		emitNet("inventory:markSecoundInventoryAsOpen", OpenedSecInventory.owner, OpenedSecInventory.type);
	}

	emitNet("inventory:useItem", _.first(data.items).name, data);
});

function closeInventory(secoundInventoryOwner: string, secoundInventoryType: types.InventoryTypes) {
	inventoryOpen = false;
	emit("randPickupAnim");
	emitNet("inventory:inventoryClosed", secoundInventoryOwner, secoundInventoryType);
	SendNuiMessage(
		JSON.stringify({
			app: "REACTNUI",
			method: "setVisibility",
			data: false,
		})
	);
	TriggerScreenblurFadeOut(400);
	SetNuiFocus(false, false);
}

RegisterCommand("openInv", () => openInventory(), false);

RegisterCommand(
	"openStore",
	() => {
		emitNet("inventory:openInventory", "store", "kiwi", 50, 5000);
	},
	false
);

RegisterRawNuiCallback("closeUi", (_data: any) => {
	const data: any = JSON.parse(_data?.body);
	closeInventory(data.secoundInventoryOwner, data.secoundInventoryType);
});
RegisterKeyMapping("openInv", "Åper inventory", "I", "");
