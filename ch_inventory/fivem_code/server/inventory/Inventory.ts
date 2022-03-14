import * as types from "@shared/types";
import dayjs from "dayjs";
import promisePool from "../db/promisePool";
import _ from "lodash";
import Item from "../inventory/Item";
import Slot, { CreateSlotClassObjectFromSlotData } from "./Slot";

export function getDiffInSecounds(date: Date) {
	if (!date?.getTime?.()) {
		date = new Date(date);
	}

	const dif = new Date().getTime() - date?.getTime?.();

	const Seconds_from_T1_to_T2 = dif / 1000;
	const Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);

	if (dayjs(date).isBefore(dayjs())) {
		return -Math.floor(Seconds_Between_Dates);
	}

	return Math.floor(Seconds_Between_Dates);
}

export function getDurabilityPrecent(createdDate: Date, expiresAt: Date): number {
	if(!createdDate) return 100;
	if(!expiresAt) return 100;
	const secoundsBetweenCreatedAtAndExpiresAt: number = dayjs(expiresAt).unix() - dayjs(createdDate).unix();
	const secoundsBetweenCurrentDataAndExpiresAt: number = dayjs(expiresAt).unix() - dayjs().unix();

	if (secoundsBetweenCurrentDataAndExpiresAt <= 0) return 0;

	return (
		100 -
		(100 -
			parseFloat(
				((secoundsBetweenCurrentDataAndExpiresAt / secoundsBetweenCreatedAtAndExpiresAt) * 100).toFixed(2)
			))
	);
}

interface internalFields {
	inUse: boolean | string;
}

class Inventory implements types.IInventory, internalFields {
	owner: string;
	currentWeight: number;
	slots: { [slotNumber: number]: types.ISlotData };
	totalSlots: number;
	totalWeight: number;
	type: types.InventoryTypes;
	inUse: boolean | string;
	label?: string | undefined;
	slotClasses: { [slotNumber: number]: Slot };

	constructor(inventory: types.IInventory) {
		this.owner = inventory.owner;
		this.slots = inventory.slots;
		this.totalSlots = inventory.totalSlots;
		this.totalWeight = inventory.totalWeight;
		this.type = inventory.type;
		this.label = inventory?.label ?? "";
		this.inUse = false;
		this.slotClasses = {};
		this.regenerateSlotClasses();

		this.calculateNewWeight();
	}

	regenerateSlotClasses() {
		_.each(this.slots, (value, key) => {
			const _Slot: Slot = CreateSlotClassObjectFromSlotData(value, parseInt(key), this.type, this.owner);
			this.slotClasses[parseInt(key)] = _Slot;
		});
	}

	calculateNewWeight() {
		let weight = 0;

		_.each(this.slotClasses, (slot) => {
			weight += slot.getSlotWeight();
		});
		this.currentWeight = weight;
		return weight;
	}

	generateSlotFromSlotData(data: types.ISlotData, slotNr: number): Slot {
		const slot: types.ISlot = {
			inventory: this.type,
			items: data.items,
			owner: this.owner,
			slotNumber: <number>slotNr,
		};

		return new Slot(slot);
	}

	toObject(): types.IInventory {
		return {
			owner: this.owner,
			slots: this.slots,
			totalSlots: this.totalSlots,
			totalWeight: this.totalWeight,
			type: this.type,
			currentWeight: this.calculateNewWeight(),
			label: this.label ?? "",
		};
	}

	hasSlots(): boolean {
		return !_.isEmpty(this.slots);
	}

	toTransferObject(): types.IInventory {
		const slots = _.cloneDeep(this.slots);

		for (const property in slots) {
			const slot = slots[property];
			slot.items = slot.items.map((item: types.Item) => {
				if(item.expiresAt) {
					if (item.expiresAt instanceof Date) {
						item.expiresAt = item.expiresAt.toString();
					}
				} else {
					delete item.expiresAt;
				}

				if (item.createdDate instanceof Date) {
					item.createdDate = item.createdDate.toString();
				}

				return item;
			});

			slots[property] = slot;
		}

		return {
			owner: this.owner,
			slots: slots,
			totalSlots: this.totalSlots,
			totalWeight: this.totalWeight,
			type: this.type,
			currentWeight: this.calculateNewWeight(),
			label: this.label ?? "",
		};
	}

	saveToDb() {
		this.clearEmptySlots();
		this.regenerateSlotClasses();
		if (["temp", "store", "drop", "crafting"].includes(this.type)) {
			return; // we do not want to store these types.
		}

		promisePool.execute("REPLACE INTO `inventories` (inventory, owner, slots) VALUES (?, ?, ?)", [
			this.type.toString(),
			this.owner.toString(),
			JSON.stringify(this.slots),
		]);
	}

	hasItem(itemName: string, count: number): boolean {
		for (const slotIndex in this.slots) {
			const slot = this.slots[slotIndex];
			const firstItem = _.first(slot?.items);

			if (!_.isNil(firstItem) && firstItem.name == itemName) {
				// stack is of the same sort. now filter out damaged items that do not work.
				const itemsThatCanBeUsed = slot?.items?.filter((item: types.Item) => {
					const _item = new Item(item);
					return !_item.isExpired();
				});
				if ((itemsThatCanBeUsed?.length ?? 0) >= count) {
					return true;
				}
			}
		}
		return false;
	}

	hasItemsReturnSlot(itemName: string, count: number, startsWithItemName: boolean = false): Slot {
		const slotKey = _.findKey(this.slots, (slotRaw, key) => {
			const slot = this.generateSlotFromSlotData(slotRaw, parseInt(key));

			const isSlotMatchingCriterias = startsWithItemName
				? slot?.firstItem?.name.startsWith(itemName)
				: slot?.firstItem?.name === itemName;

			const hasEnoughItems = slot.usableItems.length >= count;
			return isSlotMatchingCriterias && hasEnoughItems;
		});

		if (!slotKey) return null;
		const slotKeyNumber = parseInt(slotKey);
		return this.generateSlotFromSlotData(this.slots[slotKeyNumber], slotKeyNumber);
	}

	/**
	 * WARNING: this function IS NOT SAFE.
	 * @param itemName
	 * @param count
	 * @returns
	 */
	hasItemReturnSlot(itemName: string, count: number): Slot {
		// will for now only use first inventory
		const slotKey = _.findKey(this.slots, (slotraw) => {
			const isCorrectStackOfItems = (_.first(slotraw.items)?.name ?? "") === itemName;

			if (isCorrectStackOfItems) {
				// ensure that the stack of items is not worn..
				const itemsThatAreUsable = slotraw.items?.filter((item) => {
					if (!item.expiresAt) return true;
					const expireDate = item.expiresAt instanceof String ? new Date(item.expiresAt) : item.expiresAt;
					return !dayjs().isAfter(expireDate);
				});

				return !!(itemsThatAreUsable?.length ?? 0 >= count);
			}

			return false;
		});

		const slot = slotKey ? this.slots[parseInt(slotKey)] : undefined;
		if (slotKey) {
			const slotToBeRunted: types.ISlot = {
				inventory: this.type,
				owner: this.owner,
				slotNumber: parseInt(slotKey),
				items: slot.items,
			};
			return new Slot(slotToBeRunted);
		}
		return undefined;
	}

	findFreeSlotOrSameKind(itemName: string, amountToBeAddedToSlot: number): number {
		let slotIndex: string | undefined;

		_.each(this.slotClasses, (slot, key) => {
			const item = slot.getFirstItemClass();
			const slotContainsSameItems = item.name === itemName;
			const newAmountIfAdded = (slot?.items?.length ?? 0) + amountToBeAddedToSlot;
			const itemMaxStack = item?.itemData?.maxInStack ?? 64;
			if (slotContainsSameItems && newAmountIfAdded <= itemMaxStack) {
				slotIndex = key;
			}
		});

		if (slotIndex) {
			return parseInt(slotIndex);
		}

		return this.findFreeSlot();
	}

	findFreeSlot(): number {
		for (let x = 0; x < this.totalSlots; x++) {
			const slotNr = x + 1;
			if (!_.has(this.slots, slotNr)) {
				return slotNr;
			}
		}
		return -1;
	}

    /**
     * Finds the first slot that has the item with the given metadata
     * This won't work if there is more items in the slot
     * returns undefined if no slot is found
     * @param  {any} metadata Call it a search query idk.
     * @returns {Slot} The slot the item is in
     */
    findItemWithMetadata(itemName: string, metadata: { [key: string]: any }): Slot {
        
        const slotNumber = parseInt(_.findKey(this.slots, slot => {
            
            if (slot.items[0].name !== itemName) return false;
                        
            return _.some(metadata, (value, key) => slot.items[0].metadata[key] === value); 
        }));
        return _.isNaN(slotNumber) ? undefined : this.generateSlotFromSlotData(this.slots[slotNumber], slotNumber); 
    }

	addItem(itemName: string, count: number, expiresAt: Date | null, metaData: Object) {
		const slotNr = this.findFreeSlotOrSameKind(itemName, count);
		if (slotNr) {
			const isAnExisitingSlot = this.slots[slotNr]?.items;

			const item: types.Item = {
				createdDate: new Date(),
				expiresAt: expiresAt,
				name: itemName,
				metadata: metaData,
			};

			if (isAnExisitingSlot) {
				const slot = this.slots[slotNr];
				const newItems = [...slot?.items, ..._.times(count, () => item)];

				slot.items = Inventory.sortItems(newItems);
			} else {
				const slot: types.ISlot = {
					inventory: this.type,
					items: _.times(count, () => item),
					owner: this.owner,
					slotNumber: <number>slotNr,
				};

				this.slots[<number>slotNr] = slot;
			}
			this.saveToDb();
		} else {
			// not enough space...
		}
	}

	addItems(items: types.Item[]) {
		if (!items.length) return;
		const slotNr = this.findFreeSlotOrSameKind(items[0].name, items.length);
		if (!slotNr) return;

		const isAnExisitingSlot = this.slots[slotNr]?.items;

		if (isAnExisitingSlot) {
			const slot = this.slots[slotNr];
			const newItems = [...(slot?.items ?? []), ...items];

			slot.items = Inventory.sortItems(newItems);
		} else {
			const slot: types.ISlot = {
				inventory: this.type,
				items: items,
				owner: this.owner,
				slotNumber: <number>slotNr,
			};

			this.slots[<number>slotNr] = slot;
		}
	}

	static sortItems(items: types.Item[]) {
		return items.sort((a, b) => new Item(a).getDurabilityPrecent() - new Item(b).getDurabilityPrecent());
	}

	removeSlot(slotnumber: number) {
		this.slots = _.omit(this.slots, slotnumber);
	}

	clearEmptySlots() {
		_.each(this.slots, (slot, key) => {
			if (!slot.items?.length) {
				delete this.slots[parseInt(key)];
			}
		});
	}

	removeItems(itemName: string, count: number): boolean {
		// removes items that is not damaged. (usaully, you don't want to remove items that is out of date.)
		for (const slotIndex in this.slots) {
			const slot = this.slots[slotIndex];
			const firstItem = _.first(slot?.items);

			if (!_.isNil(firstItem) && firstItem.name == itemName) {
				// stack is of the same sort. now filter out damaged items that do not work.

				const itemsNotToRemove = slot?.items?.filter((item: types.Item) => {
					if (!item.expiresAt) return false;
					const expirencyDate = item.expiresAt instanceof String ? new Date(item.expiresAt) : item.expiresAt;
					return !dayjs(expirencyDate).isAfter(new Date());
				});

				if (slot.items.length - itemsNotToRemove?.length >= count) {
					let deleted = 0;
					slot.items = slot.items.filter((item: types.Item) => {
						if (!item.expiresAt && deleted < count) {
							deleted++;
							return false;
						}
						const expirencyDate =
							item.expiresAt instanceof String ? new Date(item.expiresAt) : item.expiresAt;
						const shouldBeDeleted = dayjs(expirencyDate).isAfter(new Date());
						if (shouldBeDeleted && deleted < count) {
							deleted++;
							return false;
						} else {
							return true;
						}
					});

					return true;
				}
			}
		}
		return false;
	}

	removeItemsFromSlot(slotnumber: number, amountToBeDeleted: number, removeItemsThatAreWorn = false) {
		const slot: types.ISlotData = this.slots[slotnumber];

		let deletedItems = 0;
		const newItems: types.Item[] = [];

		_.each(slot.items, (item) => {
			if ((new Item(item).isExpired() && removeItemsThatAreWorn) || deletedItems === amountToBeDeleted) {
				newItems.push(item);
			} else {
				deletedItems = deletedItems + 1;
			}
		});

		if (_.isEmpty(newItems)) {
			// there is not enough items left. Delete the whole slot.
			delete this.slots[slotnumber];
		} else {
			this.slots[slotnumber].items = newItems;
		}

		this.saveToDb();
	}

	slotDataToSlot(slotData: types.ISlotData, slotIndex: number): types.ISlot {
		return {
			items: slotData?.items ?? [],
			inventory: this.type,
			owner: this.owner,
			slotNumber: slotIndex,
		};
	}

	updateMetadata(slotIndex: number, updateMetaData: any) {
		const slot: types.ISlot = this.slotDataToSlot(this.slots[slotIndex], slotIndex);

		if (slot.items.length) {
			slot.items[0].metadata = updateMetaData;
		}
	}
    /**
     * @param  {number} slotIndex The slot you wan't to modify
     * @param  {any} updateMetaData The metadata you wan't to update / replace with
     * @param  {boolean=false} force If you want to replace the existing metadata, or just change the provided keys to the new values
     */
    updateSlotMetadata(slotIndex: number, updateMetaData: any, force: boolean = false) {
        if (this.slots[slotIndex]?.items?.length) {
            this.slots[slotIndex].items[0].metadata = force ? 
                updateMetaData :
                _.merge(this.slots[slotIndex].items[0].metadata, updateMetaData);
            this.saveToDb();
        }
    }
}

export default Inventory;
