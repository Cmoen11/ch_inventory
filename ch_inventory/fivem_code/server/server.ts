import _ from "lodash";
import drops from "./drop";
import * as types from "@shared/types";
import inventoryActions from "./inventory/InventoryActions";
import ESXHandler from "./ESX";
import InventoryActions from "./inventory/InventoryActions";
import dayjs from "dayjs";
import Item from "./inventory/Item";
import "./ItemData";
import "./tempInv/index";
import "./inventory/InventoryActions";
import "./crafting/index";
import "./ItemUse/index";
import ItemData from "./ItemData";
import Slot from "./inventory/Slot";
import TempInv from "./tempInv/index";
import { getNearbyPlayers } from "./utils";
import { XPlayer } from "esx.js/@types/server";
import { uuidv4 } from "fivem-js";

export const Delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

//
onNet("inventory:getPlayerInventory", async () => {
	const source = (global as any).source;
	const inventory = await inventoryActions.getInstance().getInventoryOrFetch("player", "1");
	emitNet("inventory:updatePlayerInventory", source, inventory.toTransferObject());
});

onNet("inventory:openStash", async (owner: string) => {
	const source = (global as any).source;
	const inventory = await inventoryActions.getInstance().getInventoryOrFetch("stash", owner);
	emitNet("inventory:updateSecoundInventory", source, inventory.toTransferObject());
});

onNet("inventory:openDrop", async (owner: string) => {
	const source = (global as any).source;
	const inventory = await inventoryActions.getInstance().getInventoryOrFetch("drop", owner);
	emitNet("inventory:updateSecoundInventory", source, inventory.toTransferObject());
});

onNet("inventory:openStore", async (owner: string) => {
	const source = (global as any).source;
	const inventory = await inventoryActions.getInstance().getInventoryOrFetch("store", owner);
	emitNet("inventory:updateSecoundInventory", source, inventory.toTransferObject());
});

onNet("inventory:moveItem", async (data: any) => {
	const source = (global as any).source;
	const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
	await inventoryActions.getInstance().moveItem(data.fromSlot, data.toSlot, data.count, xPlayer);
});

export async function openInventory(
	source: any,
	typeSecond: types.InventoryTypes,
	ownerSecond: string,
	slotscount: number,
	weight: number,
	label?: string
) {
	await Delay(Math.floor(Math.random() * 500));

	const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
	emitNet("inventory:updateBalance", source, xPlayer.getMoney());

	const inventories = await inventoryActions.getInstance().openInventory(
		{
			type: "player",
			owner: `${xPlayer.charid}`,
			slotCount: 60,
			weight: 100,
		},
		{
			type: typeSecond,
			owner: ownerSecond,
			slotCount: slotscount,
			weight: weight,
		}
	);

	if (inventories) {
		let secoundInventoryLabel = label ?? inventories?.secoundInventory?.label;

		if (inventories.secoundInventory.type === "drop") {
			const [owner, x, y, z] = inventories.secoundInventory.owner.split("_");
			secoundInventoryLabel = `Drop: ${x} ${y} ${z}`;
		} else if (inventories.secoundInventory.type === "glovebox") {
			secoundInventoryLabel = `Hanskerom: ${inventories.secoundInventory.owner}`;
		}

		emitNet("inventory:openInventory", source, {
			playerInventory: { ...inventories.playerInventory.toTransferObject(), label: `👨 ${xPlayer.charname}` },
			secoundInventory: { ...inventories.secoundInventory.toTransferObject(), label: secoundInventoryLabel },
		});
	} else {
		// open prevented, todo add error message to the user.
	}
}

onNet("inventory:getNeabyPlayers", async () => {
	const source = (global as any).source;
	const nearestPlayers = getNearbyPlayers(source, 5);
	emitNet("inventory:updateNearbyPlayers", source, nearestPlayers);
});

onNet(
	"inventory:openInventory",
	async (
		typeSecond: types.InventoryTypes,
		ownerSecond: string,
		slotscount: number,
		weight: number,
		label?: string
	) => {
		const source = (global as any).source;
		openInventory(source, typeSecond, ownerSecond, slotscount, weight, label);
	}
);

global.exports(
	"OpenInventoryFromServer",
	(
		source: any,
		typeSecond: types.InventoryTypes,
		ownerSecond: string,
		slotscount: number,
		weight: number,
		label?: string
	) => openInventory(source, typeSecond, ownerSecond, slotscount, weight, label)
);

onNet("inventory:updateMetadata", async (slot: types.ISlot) => {
	const source = (global as any).source;
	const inventory = await inventoryActions.getInstance().getInventoryOrFetch(slot.inventory, slot.owner);
	if (inventory.slotClasses[slot.slotNumber].getFirstItem().name === _.first(slot.items).name) {
		inventory.updateMetadata(slot.slotNumber, _.first(slot.items).metadata);
	}
});

onNet("inventory:markSecoundInventoryAsOpen", async (secoundaryOwner: string, secoundaryType: types.InventoryTypes) => {
	const secInventory = await inventoryActions.getInstance().getInventoryOrFetch(secoundaryType, secoundaryOwner);

	secInventory.inUse = false;
});

onNet("inventory:inventoryClosed", async (secoundaryOwner: string, secoundaryType: types.InventoryTypes) => {
	const source = (global as any).source;
	const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
	await inventoryActions.getInstance().closeInventory(
		{
			type: "player",
			owner: `${xPlayer.charid}`,
		},
		{
			type: secoundaryType,
			owner: secoundaryOwner,
		}
	);

	if (secoundaryType === "trunk") {
		emitNet("inventory:trunkClosed", source);
	}

	const playerInventory = await inventoryActions
		.getInstance()
		.getInventoryOrFetch("player", xPlayer.charid.toString());

	drops.createOrDeleteDropZone(secoundaryOwner);
});

onNet("inventory:getCurrentBalance", async () => {
	const source = (global as any).source;
	const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
	emitNet("inventory:updateBalance", source, xPlayer.getMoney());
});

global.exports("AddItemToSource", async (source: any, itemId: string, count: number, metaData: any) => {
	const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);

	if (!_.has(ItemData.getInstance().data, itemId)) {
		return;
	}

	const itemData = ItemData.getInstance().data[itemId];
	const expireDate = itemData?.expiresAt;

	const inventory = await inventoryActions.getInstance().getInventoryOrFetch("player", `${xPlayer.charid}`);
	const itemWeight = ItemData.getInstance().data[itemId].itemWeight * count;

	if (itemWeight + inventory.currentWeight > inventory.totalWeight) {
		const tempInv = TempInv.getInstance().createTempInv("Plukk opp items", [
			{ itemId: itemId, count: count, expireDate: expireDate, metaData: metaData },
		]);

		openInventory(source, tempInv.type, tempInv.owner, 50, 500, "Plukk opp items");

		return;
	}

	const _expireDate = expireDate ? dayjs().add(expireDate.amount, expireDate.ofWhat).toDate() : null;
	InventoryActions.getInstance().addItems(itemId, count, metaData, _expireDate, "player", `${xPlayer.charid}`);

	emitNet("inventory:updatePlayerInventory", source, inventory.toTransferObject());

	const item: types.Item = {
		createdDate: new Date(),
		expiresAt: _expireDate,
		name: itemId,
		metadata: {},
	};

	const items = _.times(count, () => item);

	const slot: types.ISlot = {
		inventory: "player",
		owner: `${xPlayer.charid}`,
		slotNumber: 10,
		items: items,
	};

	addSlotEvent(source, slot, "ADDED");
});

async function RemoveItemFromSlot(source: any, slot: Slot, amount: number, removeWornItems: boolean = false) {
	const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
	const inventory = await inventoryActions.getInstance().getInventoryOrFetch(slot.inventory, slot.owner);
	inventory.removeItemsFromSlot(slot.slotNumber, amount, removeWornItems);
	if (inventory.inUse || inventory.type === "player") {
		if (inventory.type === "player" && inventory.owner === xPlayer.charid.toString()) {
			emitNet("inventory:updatePlayerInventory", source, inventory.toTransferObject());
		} else {
			emitNet("inventory:updateSecoundInventory", source, inventory.toTransferObject());
		}
	}
	addSlotEvent(
		source,
		{
			...slot,
			items: _.times(amount, () => slot.firstItem),
		},
		"REMOVED"
	);
}

global.exports("RemoveItemFromSlot", RemoveItemFromSlot);
global.exports(
	"RemoveItemsFromSlotIndex",
	async (source: any, invType: types.InventoryTypes, owner: string, slotIndex: number, count: number) => {
		const inventory = await inventoryActions.getInstance().getInventoryOrFetch(invType, owner);
		const slot = inventory.slots[slotIndex];
		RemoveItemFromSlot(source, new Slot(inventory.slotDataToSlot(slot, slotIndex)), count);
	}
);

global.exports(
	"HasItem",
	async (inventoryType: types.InventoryTypes, owner: string, itemName: string, count: number) => {
		const inventory = await inventoryActions.getInstance().getInventoryOrFetch(inventoryType, owner);
		const slotReturned = inventory.hasItemsReturnSlot(itemName, count);
		if (slotReturned) {
			slotReturned.items.map((item) => new Item(item).sanitizeObject());
			return slotReturned;
		}

		return undefined;
	}
);

global.exports("HasItemLua2", (source: any, itemName: string, count: number) => {
	const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
	const inventory = InventoryActions.getInstance().getInventoryDoNotFetch("player", xPlayer.charid.toString());

	if (!inventory) {
		// no inventory in cache, since fivem does not support js promise. we just gonna say false :)
		return false;
	}

	return inventory.hasItemsReturnSlot(itemName, count);
});

global.exports('getInventoryDoNotFetch', InventoryActions.getInstance().getInventoryDoNotFetch.bind(InventoryActions.getInstance()));

global.exports("RemoveItem", (source: any, itemName: string, count: number) => {
	const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
	const inventory = InventoryActions.getInstance().getInventoryDoNotFetch("player", xPlayer.charid.toString());

	if (!inventory) {
		// no inventory in cache, since fivem does not support js promise. we just gonna say false :)
		return false;
	}
	const slotReturned = inventory.hasItemsReturnSlot(itemName, count);
	RemoveItemFromSlot(source, slotReturned, count, false);
});

global.exports('findItemWithMetadata', (source: any, itemName: string, metadata: any) => {
    const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
    const inventory = InventoryActions.getInstance().getInventoryDoNotFetch('player', xPlayer.charid.toString());
    if (!inventory) return -1;

    return inventory.findItemWithMetadata(itemName, metadata);
});

global.exports('updateSlotMetadata', (source: any, slotIndex: number, metadata: any) => {
    const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
    const inventory = InventoryActions.getInstance().getInventoryDoNotFetch('player', xPlayer.charid.toString());

    if (!inventory) return false;
    if (!inventory.slots[slotIndex]?.items?.length) return false;

    inventory.updateSlotMetadata(slotIndex, metadata);
});

global.exports('generateSerial', (long: boolean = false) => long ? uuidv4() : uuidv4().split("-")[0]);

onNet("inventory:RemoveItemFromSlot", (slot: Slot, amount: number, removeWornItems: boolean = false) =>
	RemoveItemFromSlot((global as any).source, slot, amount, removeWornItems)
);

onNet("inventory:giveItem", (playerId: string, slot: types.ISlot) => {
	const source = (global as any).source;
	InventoryActions.getInstance().giveItem(source, playerId, slot);
});

function addSlotEvent(source: any, slot: types.ISlot, action: types.SlotEventTypes) {
	const slotEvent: types.SlotEvent = {
		action: action,
		slot: {
			...slot,
			items: slot.items.map((item) => {
				const _item = new Item(item);
				return _item.sanitizeObject();
			}),
		},
	};
	emitNet("inventory:addSlotEvent", source, slotEvent);
}

on("esx:playerLoaded", async (playerId: number, xPlayer: XPlayer) => {
	const inventory = await inventoryActions.getInstance().getInventoryOrFetch("player", xPlayer.charid.toString());
	emitNet("inventory:updatePlayerInventory", playerId, inventory.toTransferObject());
});

// RegisterCommand(
// 	"giveMeWeapon",
// 	async (source: string) => {
// 		const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
// 		const expireDate = dayjs().add(20, "minutes").toDate();

// 		InventoryActions.getInstance().addItems(
// 			"WEAPON_MINISMG",
// 			1,
// 			{ Ammo: 2000 },
// 			expireDate,
// 			"player",
// 			`${xPlayer.charid}`
// 		);
// 	},
// 	false
// );
