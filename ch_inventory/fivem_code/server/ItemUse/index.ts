import * as types from "@shared/types";
import _ from "lodash";
import InventoryActions from "../inventory/InventoryActions";
import ESXHandler from "../ESX";
import Slot from "../inventory/Slot";
import { openInventory } from "../server";
import { getNearbyPlayers, addSlotEvent } from "../utils/index";

const globalAny: any = global;

export class ItemUse {
	private registedItemUseActions: { [itemName: string]: string } = {};

	constructor() {
		onNet("inventory:use:itemRegistration", (callbackEvent: string, itemName: string) => {
			this.addRegisterItemAction(itemName, callbackEvent);
		});

		onNet("inventory:useItem", async (itemName: string, slot: types.ISlot) => {
			const source = (global as any).source;
			this.useItemRegular(source, itemName, slot);
		});

		onNet("inventory:hotkeyUse", async (slotIndex: number) => {
			const source = (global as any).source;
			this.useItemHotkey(source, slotIndex);
		});
	}

	addRegisterItemAction(itemName: string, callbackEvent: string): void {
		this.registedItemUseActions[itemName] = callbackEvent;
	}

	async useItemHotkey(source: any, slotIndex: number) {
		const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
		const inventory = await InventoryActions.getInstance().getInventoryOrFetch("player", `${xPlayer.charid}`);

		if (_.isNil(inventory.slots[slotIndex])) {
			return;
		}
		inventory.regenerateSlotClasses();
		const slot = inventory.slotClasses[slotIndex];
		const firstItem = slot.getFirstItemClass();
		if (firstItem.isExpired()) {
			emitNet("sawu_notify:SendAlertLong", source, { type: "error", text: "Gjenstanden er for slitt" });
			return;
		}

		if (firstItem.name.startsWith("WEAPON")) {
			/**
			 * If item is a weapon, we want to handle it.
			 */
			emitNet("inventory:useWeapon", source, slot);
			emitNet("evidence:updateMetaData", source, slot.firstItem.metadata);
			return;
		}
		addSlotEvent(source, slot, "USED");

		if (firstItem.name.startsWith("ammo-")) {
			emitNet("inventory:reloadWeapon", source, slot, slotIndex);
			return;
		}

		this.useItemRegular(source, slot.firstItem.name, slot);
	}

	async useItemRegular(source: any, itemName: string, _slot: types.ISlot) {
		const slot = new Slot(_slot);
		if (slot.firstItem.isExpired()) {
			emitNet("sawu_notify:SendAlertLong", source, { type: "error", text: "Gjenstanden er for slitt" });
			return;
		}

		if (slot.inventory === "store" || slot.inventory === "crafting") {
			emitNet("sawu_notify:SendAlertLong", source, {
				type: "error",
				text: `Du blir nødt til å ${slot.inventory === "store" ? "kjøpe" : "bygge"} gjenstanden først.`,
			});
			return;
		}

		if (itemName === "bag") {
			const serieNummer = slot.firstItem.metadata.Serienummer;
			openInventory(source, "bag", serieNummer, 10, 50, "Gymbag");
		}

		// if (itemName === "drivelicense") {
		// 	// give to nearest player
		// 	const nearestPlayers = getNearbyPlayers(source, 5);
		// 	const nearestPlayer = nearestPlayers.find((player) => player.serverId.toString() !== source.toString());

		// 	if (nearestPlayer) {
		// 		// remove from users inventory
		// 		const xPlayer = ESXHandler.ESX.GetPlayerFromId(source);
		// 		const userInventory = await InventoryActions.getInstance().getInventoryOrFetch(
		// 			"player",
		// 			`${xPlayer.charid}`
		// 		);
		// 		userInventory.removeItemsFromSlot(slot.slotNumber, 1, true);
		// 		userInventory.saveToDb();
		// 		addSlotEvent(source, _slot, "REMOVED");

		// 		// give item to nearest player
		// 		const item = slot.getFirstItemClass();

		// 		const xTarget = ESXHandler.ESX.GetPlayerFromId(nearestPlayer.serverId);
		// 		const inventory = await InventoryActions.getInstance().getInventoryOrFetch(
		// 			"player",
		// 			`${xTarget.charid}`
		// 		);

		// 		inventory.addItem(item.name, 1, item.createdDateDateObject, item.metadata);
		// 		inventory.saveToDb();
		// 		addSlotEvent(nearestPlayer.serverId, _slot, "ADDED");
		// 	}
		// }

		this.useItem(itemName, slot, source);
	}

	useItem(itemName: string, slot: types.ISlot, source: any) {
		if (_.has(this.registedItemUseActions, itemName)) {
			emit(this.registedItemUseActions[itemName], source, _.omit(slot, ["items", "ItemClasses"]));
		}
	}

	public static getInstance(): ItemUse {
		if (!globalAny.itemUseInstance) {
			globalAny.itemUseInstance = new ItemUse();
		}

		return globalAny.itemUseInstance;
	}
}

ItemUse.getInstance();

export default ItemUse;
