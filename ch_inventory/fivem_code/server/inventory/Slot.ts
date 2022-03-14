import * as types from "@shared/types";
import _ from "lodash";
import Item from "./Item";

export function CreateSlotClassObjectFromSlotData(
	slot: types.ISlotData,
	slotnumber: number,
	inventoryType: types.InventoryTypes,
	owner: string
): Slot {
	return new Slot({
		items: slot.items ?? [],
		inventory: inventoryType,
		owner: owner,
		slotNumber: slotnumber,
	});
}

class Slot implements types.ISlot {
	inventory: types.InventoryTypes;
	items: types.Item[];
	owner: string;
	slotNumber: number;
	ItemClasses: Item[];
	firstItem: Item;

	constructor(slot: types.ISlot) {
		this.inventory = slot.inventory;
		this.items = slot.items;
		this.owner = slot.owner;
		this.slotNumber = slot.slotNumber;
		this.ItemClasses = slot?.items?.map((item) => new Item(item)) ?? [];
		this.firstItem = new Item(_.first(this.items));
	}

	toSlotData(): types.ISlotData {
		return {
			items: this.items,
		};
	}

	get usableItems(): Item[] {
		return this.ItemClasses.filter((item) => !item.isExpired());
	}

	getItemData() {
		return _.first(this.ItemClasses)?.itemData;
	}

	getFirstItem() {
		return _.first(this.items);
	}

	getFirstItemClass() {
		return _.first(this.ItemClasses);
	}

	sortSlot() {
		this.ItemClasses = this.ItemClasses.sort((a, b) => a.getDurabilityPrecent() - b.getDurabilityPrecent());
		this.items = this.ItemClasses;
	}

	getSlotWeight(): number {
		const items = this.items?.length ?? 0;
		const weightPrItem = this.getItemData()?.itemWeight ?? 0;
		return items * weightPrItem;
	}

	updateMetaData(newMetadata: any) {
		_.first(this.ItemClasses).metadata = newMetadata;
		this.items = this.ItemClasses;
	}
}

export default Slot;
