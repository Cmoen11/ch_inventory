import * as types from "@shared/types";
import dayjs from "dayjs";
import { uuidv4 } from "fivem-js";
import Inventory from "../inventory/Inventory";
import _ from "lodash";
import ItemData from "../ItemData";

type ItemType = {
	itemId: string;
	count: number;
	expireDate: types.ExpireDateObjectType;
	metaData: {};
	recipe?: types.Crafting
};

const globalAny: any = global;

class Crafting {
	craftingStations: types.CraftingDictionary;
	tempCraftingStations: { [name: string]: Inventory };

	constructor() {
		this.craftingStations = JSON.parse(LoadResourceFile(GetCurrentResourceName(), "CraftingStations.json"));
		this.tempCraftingStations = {};
		global.exports("CreateCraftingInv", this.createCraftingInventory.bind(this));
	}

	getCraftingInventory(craftingName: string) {
		if (_.has(this.tempCraftingStations, craftingName)) {
			return this.tempCraftingStations[craftingName];
		}

		const crafting: types.CraftingEntity = this.craftingStations?.[craftingName];

		let slots: types.InventorySlotType = {};
		_.each(crafting.slots, (_slotRaw, _slotIndex) => {
			const slotRaw = _.cloneDeep(_slotRaw);
			const slotIndex = _slotIndex + 1;
			if (!_.isEmpty(slotRaw.metadata)) {
				_.each(slotRaw.metadata, (value, key) => {
					if (value === "<Serial>") {
						slotRaw.metadata[key] = uuidv4().split("-")[0];
					}
				});
			}

			if (!slotRaw.expiresAt) {
				const defaultExpiresAt = ItemData.getInstance()?.data?.[slotRaw.name]?.expiresAt
				slotRaw.expiresAt = defaultExpiresAt ? defaultExpiresAt : null;
			}

			const slot = {
				inventory: "crafting",
				owner: crafting.name,
				items: _.times(slotRaw.count, () => ({
					createdDate: new Date(),
					expiresAt: slotRaw.expiresAt ? dayjs().add(slotRaw.expiresAt.amount, slotRaw.expiresAt.ofWhat).toDate() : null,
					name: slotRaw.name,
					metadata: slotRaw.metadata,
				})),
				slotNumber: slotIndex,
			};

			slots = { ...slots, [slotIndex]: slot };
		});

		const inventory: types.IInventory = {
			currentWeight: 0,
			owner: craftingName,
			slots: slots,
			totalSlots: 50,
			totalWeight: 2000,
			type: "crafting",
		};

		const InventoryObject = new Inventory(inventory);
		return InventoryObject;
	}

	createCraftingInventory(label: string, items: ItemType[]) {
		const inventoryOwner = uuidv4();
		const inventoryType = "crafting";

		const slots: types.InventorySlotType = {};
		items.forEach((slotRaw, index) => {
			const itemData = ItemData.getInstance().data[slotRaw.itemId];

			if (!slotRaw.expireDate) {
				slotRaw.expireDate = itemData.expiresAt;
			}

			const _expireDate = slotRaw.expireDate ? dayjs().add(slotRaw.expireDate.amount, slotRaw.expireDate.ofWhat).toDate() : null;
			const _items = _.times(slotRaw.count, () => ({
				name: slotRaw.itemId,
				createdDate: new Date(),
				expiresAt: _expireDate,
				metadata: slotRaw.metaData,
			}));

			const slot: types.ISlot = {
				owner: inventoryOwner,
				inventory: inventoryType,
				slotNumber: index + 1,
				items: _items,
				recipe: slotRaw.recipe,
			};

			slots[index + 1] = slot;
		});

		const inventory: types.IInventory = {
			currentWeight: 0,
			owner: inventoryOwner,
			slots: slots,
			totalSlots: 50,
			totalWeight: 400,
			type: "crafting",
			label: label,
		};

		this.tempCraftingStations[inventoryOwner] = new Inventory(inventory);

		return {
			type: inventoryType,
			owner: inventoryOwner,
		};
	}

	static getInstance(): Crafting {
		if (!globalAny.CraftingInstance) {
			globalAny.CraftingInstance = new Crafting();
		}
		return globalAny.CraftingInstance;
	}
}

Crafting.getInstance();

export default Crafting;
