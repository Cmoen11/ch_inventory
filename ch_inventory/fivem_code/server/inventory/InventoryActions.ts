import * as types from "@shared/types";
import promisePool from "../db/promisePool";
import _ from "lodash";
import Inventory from "./Inventory";
import { StaticImplements } from "../utils/decorators";
import ItemData from "../ItemData";
import { XPlayer } from "esx.js/@types/server";
import ShopInv from "../shop";
import Crafting from "../crafting";
import dayjs from "dayjs";
import Item from "./Item";
import { validate as uuidValidate } from "uuid";
import Log from "../logs";
import ESXHandler from "../ESX";
import Slot from "./Slot";
import { addSlotEvent } from "../utils/index";

type InventoriesWithOwnerKey = { [owner: string]: Inventory };
type InventoryTypeKey = { [inventoryType: string]: InventoriesWithOwnerKey };

type inventoryRequestType = {
	type: types.InventoryTypes;
	owner: string;
	slotCount: number;
	weight: number;
};
export const Delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const globalAny: any = global;

@StaticImplements<types.Singelton<InventoryActions>>()
class InventoryActions {
	private inventories: InventoryTypeKey;

	utilityInventories: any;

	constructor() {
		this.inventories = {
			player: {},
			stash: {},
			glovebox: {},
			drop: {},
			temp: {},
			store: {},
			bag: {},
			trunk: {},
		};

		this.utilityInventories = {
			store: (owner: string) => ShopInv.GetInstance().getStoreInventory(owner),
			crafting: (owner: string) => Crafting.getInstance().getCraftingInventory(owner),
		};
	}

	createInventory(
		_type: types.InventoryTypes,
		_owner: string,
		_label: string = "",
		_slots?: types.InventorySlotType
	) {
		const inventory: types.IInventory = {
			currentWeight: 0,
			owner: _owner,
			slots: _slots ?? {},
			totalSlots: 60,
			totalWeight: 120,
			label: _label ?? "",
			type: _type,
		};
		this.inventories[_type][_owner] = new Inventory(inventory);

		return inventory;
	}

	hasLocalInventory(type: types.InventoryTypes, owner: string) {
		return _.has(this.inventories[type], owner);
	}

	getInventoryDoNotFetch(type: types.InventoryTypes, owner: string) {
		const inv: Inventory | undefined = _.has(this.utilityInventories, type)
			? this.utilityInventories?.[type](owner)
			: this.inventories?.[type]?.[owner];
		return inv;
	}

	async getInventoryOrFetch(type: types.InventoryTypes, owner: string) {
		const inv: Inventory | undefined = _.has(this.utilityInventories, type)
			? this.utilityInventories?.[type](owner)
			: this.inventories?.[type]?.[owner];

		if (_.isNil(inv)) {
			const [raw] = await promisePool.query("SELECT * FROM `inventories` WHERE inventory = ? AND owner = ?", [
				type,
				owner,
			]);
			const [_result] = <any[]>raw;
			if (_.isNil(_result)) {
				return new Inventory(this.createInventory(type, owner));
			}

			const inventory: types.IInventory = {
				slots: JSON.parse(_result.slots),
				owner: _result.owner,
				type: _result.inventory,
				totalSlots: 120,
				currentWeight: 0, // will be calulcated when we create a Inventory object.
				totalWeight: 100,
			};

			this.inventories[type][owner] = new Inventory(inventory);
			return this.inventories[type][owner];
		}

		return inv; // maybe clone deep..
	}

	hasItem(inventory: types.IInventory, itemName: string, count: number) {
		// will for now only use first inventory
		const hasItems = _.find(inventory.slots, (slotraw: types.ISlotData) => {
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

		return !!hasItems?.items;
	}

	validateCrafting(inventory: types.IInventory, itemToBeCrafted: string) {
		const itemDataToBeCrafted = ItemData?.getInstance().data[itemToBeCrafted];

		if (itemDataToBeCrafted) {
			const itemsItemRequired = itemDataToBeCrafted.crafting?.itemsRequired ?? [];

			const hasAllItemsRequired = !itemsItemRequired.find((item) => {
				return !this.hasItem(inventory, item.itemName, item.amount);
			});

			return hasAllItemsRequired;
		}

		return false;
	}

	validateCustomCrafting(inventory: types.IInventory, itemToBeCrafted: string, recipe: types.Crafting = { itemsRequired: [] }) {
		const itemDataToBeCrafted = ItemData?.getInstance().data[itemToBeCrafted];
		if (itemDataToBeCrafted) {

			const hasAllItemsRequired = !recipe.itemsRequired.find((item) => {
				return !this.hasItem(inventory, item.itemName, item.amount);
			});

			return hasAllItemsRequired;
		}

		return false;
	}

	async moveItem(_fromSlot: types.ISlot, _toSlot: types.ISlot, count: number, xPlayer: XPlayer) {
		if (count <= 0) return;

		let [fromInventory, toInventory] = await Promise.all([
			this.getInventoryOrFetch(_fromSlot.inventory, _fromSlot.owner),
			this.getInventoryOrFetch(_toSlot.inventory, _toSlot.owner),
		]);

		const __BACKUP_fromInventory = _.cloneDeep(fromInventory);
		const __BACKUP_toInventory = _.cloneDeep(toInventory);

		try {
			const isWithinSameInventory =
				fromInventory.owner === toInventory.owner && fromInventory.type === toInventory.type;
			if (isWithinSameInventory) {
				// if move is within the same inventory
				fromInventory = toInventory;
			}

			let fromSlot = fromInventory.slots[_fromSlot.slotNumber];
			let toSlot = toInventory.slots[_toSlot.slotNumber];

			const isToSlotEmpty = _.isUndefined(_.first(toSlot?.items ?? []));
			const isShopping = fromInventory.type === "store";
			const isCrafting = fromInventory.type === "crafting";
			const firstItem = new Item(_.first(_fromSlot.items));

			if (_toSlot.inventory === "store" || _toSlot.inventory === "crafting") {
				// prevent moving into and moving around in the store inventory
				return;
			}

			if (isShopping) {
				const currentBalance = xPlayer.getMoney();

				const itemsToBeShopped = count;
				const pricePrItem = ItemData.getInstance().data[_.first(_fromSlot.items).name].price;
				const totalPrice = itemsToBeShopped * pricePrItem;

				if (currentBalance < totalPrice) {
					return;
				}

				const newBalance = currentBalance - totalPrice;
				xPlayer.setMoney(newBalance);

				Log(
					xPlayer.source,
					`Kjøpte ${firstItem.itemData.label}(${firstItem.name}) x ${count} fra ${_fromSlot.owner}(${_fromSlot.inventory}) `,
					"butikk",
					firstItem.metadata
				);
			}

			if (isCrafting) {

				const itemToBeCrafted = _.first(_fromSlot.items).name;
				const recipe: types.Crafting = fromSlot?.recipe ?? ItemData?.getInstance().data[itemToBeCrafted]?.crafting;
				if (itemToBeCrafted && recipe) {
					if (!this.validateCustomCrafting(toInventory, itemToBeCrafted, recipe)) {
						return;
					}
				}
				const craftingRequirement = recipe?.itemsRequired ?? [];
				craftingRequirement.forEach((item) => {
					if (item.itemName.startsWith("blueprint_")) {
						return;
					}
					const slot = toInventory.hasItemsReturnSlot(item.itemName, item.amount, false);
					if (slot) {
						toInventory.removeItemsFromSlot(slot.slotNumber, item.amount, false);

						const slotEvent: types.SlotEvent = {
							action: "REMOVED",
							slot: {
								...slot,
								items: _.take(slot.items, item.amount).map((item) => {
									const _item = new Item(item);
									return _item.sanitizeObject();
								}),
							},
						};
						emitNet("inventory:addSlotEvent", xPlayer.source, slotEvent);

					}
				});
                Log(
                    xPlayer.source,
                    `Crafted ${firstItem.itemData.label}(${firstItem.name}) x ${count} fra ${_fromSlot.owner}(${_fromSlot.inventory}) `,
                    "crafting",
                    firstItem.metadata
                );
			}

			// Regular move...
			if (isToSlotEmpty || _.isEqual(_.first(toSlot.items)?.name, _.first(fromSlot.items)?.name)) {
				const itemsToSlot = [...(fromInventory.slots[_fromSlot.slotNumber].items?.splice(0, count) ?? [])];
				
				if (isCrafting) {
					fromInventory.slots[_fromSlot.slotNumber].items = [...itemsToSlot, ...fromInventory.slots[_fromSlot.slotNumber].items]
				}

				if (_.isEmpty(fromInventory.slots[_fromSlot.slotNumber].items) && !isCrafting && !isShopping) {
					fromInventory.removeSlot(_fromSlot.slotNumber);
				}
				if (!_.has(toInventory.slots, _toSlot.slotNumber)) {
					toInventory.slots[_toSlot.slotNumber] = { items: Inventory.sortItems(itemsToSlot) };
				} else {
					toInventory.slots[_toSlot.slotNumber].items = Inventory.sortItems([
						...itemsToSlot,
						...(toInventory.slots[_toSlot.slotNumber].items ?? []),
					]);
				}

				if (!isWithinSameInventory && !isCrafting && !isShopping) {
					Log(
						xPlayer.source,
						`Flyttet ${firstItem.itemData.label}(${firstItem.name}) x ${count} fra ${_fromSlot.owner} (${_fromSlot.inventory}) til ${_toSlot.owner} (${_toSlot.inventory}) `,
						"inventory",
						firstItem.metadata
					);
                    
					emit('inventory:movedItemFromInventory', xPlayer.source, firstItem.itemData.name, count, fromInventory.toObject(), toInventory.toObject())
				}
			} else if (!_toSlot.items.length || _.first(_toSlot.items)?.name !== _.first(_fromSlot.items)?.name) {
				// swap item positions
				const slotTemp: types.ISlot = _toSlot;
				toInventory.slots[_toSlot.slotNumber] = _.pick(_fromSlot, ["items"]);
				fromInventory.slots[_fromSlot.slotNumber] = _.pick(slotTemp, ["items"]);

				const toSlotItem = new Item(_.first(_toSlot.items));

				if (!isWithinSameInventory && !isCrafting && !isShopping) {
					Log(
						xPlayer.source,
						`Swappet ${firstItem.itemData.label}(${firstItem.name}) fra ${_fromSlot.owner} (${_fromSlot.inventory}) med ${toSlotItem.itemData.label}(${toSlotItem.name}) ${_toSlot.owner} (${_toSlot.inventory}) `,
						"inventory",
						firstItem.metadata
					);
				}
			}
			
			toInventory.calculateNewWeight();
			if (toInventory.currentWeight > toInventory.totalWeight) {
				throw new Error("Exceeding maximum weight");
			}

			toInventory.saveToDb();
			if (!isWithinSameInventory) {
				fromInventory.saveToDb();
				fromInventory.calculateNewWeight();
			}


			if (isShopping || isCrafting) {
				// send back a fresh store inventory
				const isNormalCrafting = !uuidValidate(fromInventory.owner);

				const secInventory = isNormalCrafting ? 
					await this.getInventoryOrFetch(fromInventory.type, fromInventory.owner) :
					__BACKUP_fromInventory;

				console.log('Shopping and Crafting logic... send that shit back');

				emitNet("inventory:updateSecoundInventory", xPlayer.source, secInventory.toTransferObject());

				// const playerInventory = toInventory;
				// emitNet("inventory:updatePlayerInventory", xPlayer.source, playerInventory.toTransferObject());
			}
		} catch (err) {
			console.log(err.message);
			// restore to previous.

			this.inventories[__BACKUP_fromInventory.type][__BACKUP_fromInventory.owner] = __BACKUP_fromInventory;
			this.inventories[__BACKUP_toInventory.type][__BACKUP_toInventory.owner] = __BACKUP_toInventory;

			// todo send client updated inventories, to refelect current state.

			Log(xPlayer.source, `Oppstod en feil i inventaret`, "inv_error", err);

			__BACKUP_fromInventory.saveToDb();
			__BACKUP_toInventory.saveToDb();
		}
	}

	async removeItems(itemName: string, count: number, type: types.InventoryTypes, owner: string) {
		const inventory = await this.getInventoryOrFetch(type, owner);
		return inventory.removeItems(itemName, count);
	}

	async openInventory(playerInventory: inventoryRequestType, secoundInventory: inventoryRequestType) {
		const [_playerInventory, _secoundInventory] = await Promise.all([
			this.getInventoryOrFetch(playerInventory.type, playerInventory.owner),
			this.getInventoryOrFetch(secoundInventory.type, secoundInventory.owner),
		]);

		if (_playerInventory.inUse || _secoundInventory.inUse) {
			const canOpenPlayerInv =
				!_playerInventory.inUse || (_playerInventory.inUse && _playerInventory.inUse === playerInventory.owner);
			const canOpenSecoundInventory =
				!_secoundInventory.inUse ||
				(_secoundInventory.inUse && _secoundInventory.inUse === playerInventory.owner);

			if (!canOpenPlayerInv || !canOpenSecoundInventory) {
				// prevent opening of inventory as the inventory is already open by someone else?
				return false;
			}
		}

		// update inUse for the inventories.
		_playerInventory.inUse = playerInventory.owner;
		_secoundInventory.inUse = playerInventory.owner;

		_playerInventory.totalSlots = playerInventory.slotCount;
		_playerInventory.totalWeight = playerInventory.weight;
		_secoundInventory.totalSlots = secoundInventory.slotCount;
		_secoundInventory.totalWeight = secoundInventory.weight;

		return {
			playerInventory: _playerInventory,
			secoundInventory: _secoundInventory,
		};
	}

	async closeInventory(
		playerInventory: Omit<Omit<inventoryRequestType, "slotCount">, "weight">,
		secoundInventory: Omit<Omit<inventoryRequestType, "slotCount">, "weight"> | undefined
	) {
		const _playerInventory = await this.getInventoryOrFetch(playerInventory.type, playerInventory.owner);
		const _secoundInventory = _.isNil(secoundInventory)
			? undefined
			: await this.getInventoryOrFetch(secoundInventory.type, secoundInventory.owner);

		// set inUse to false for the inventories
		_playerInventory.inUse = false;

		if (_secoundInventory) {
			_secoundInventory.inUse = false;
		}
	}

	async giveItem(fromSource: string, toSource: string, _slot: types.ISlot) {
		const slot = new Slot(_slot);
		const xPlayer = ESXHandler.ESX.GetPlayerFromId(fromSource);
		const xTarget = ESXHandler.ESX.GetPlayerFromId(toSource);

		if (!(xPlayer.charid.toString() === slot.owner && slot.inventory === "player")) {
			return; // prevent giving from another than the fromSource's inventory.
		}

		const fromSourceInventory = await InventoryActions.getInstance().getInventoryOrFetch(
			"player",
			`${xPlayer.charid}`
		);
		const toSourceInventory = await InventoryActions.getInstance().getInventoryOrFetch(
			"player",
			`${xTarget.charid}`
		);

		// remove from inventory
		fromSourceInventory.removeItemsFromSlot(slot.slotNumber, slot.items.length, true);
		// add to invnetory
		toSourceInventory.addItems(slot.items);

		Log(
			xPlayer.source,
			`Ga ${slot.getFirstItemClass.name} x ${slot.items.length} til ${xTarget.charname}`,
			"inventory",
			slot.firstItem.metadata
		);

		addSlotEvent(fromSource, _slot, "REMOVED");
		addSlotEvent(toSource, _slot, "ADDED");
	}

	async addItems(
		itemName: string,
		count: number,
		metadata: any,
		expiresAt: Date | null,
		type: types.InventoryTypes,
		owner: string
	) {
		const inventory = await this.getInventoryOrFetch(type, owner);
		inventory.addItem(itemName, count, expiresAt, metadata);
	}

	static getInstance(): InventoryActions {
		if (!globalAny.InventoryActionsInstance) {
			globalAny.InventoryActionsInstance = new InventoryActions();
		}

		return globalAny.InventoryActionsInstance;
	}
}

InventoryActions.getInstance();

export default InventoryActions;
