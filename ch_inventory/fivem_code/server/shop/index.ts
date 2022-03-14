import * as types from "@shared/types";
import dayjs from "dayjs";
import Inventory from "../inventory/Inventory";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { capitalize } from "../utils";
import ItemData from "../ItemData";

const globalany: any = global;
class ShopInv {
	stores: types.ShopDictionary;

	constructor() {
		this.stores = JSON.parse(LoadResourceFile(GetCurrentResourceName(), "Stores.json"));
	}

	getStoreInventory(storeName: string) {
		const store: types.ShopEntity = this.stores?.[storeName];

		let slots: types.InventorySlotType = {};
		_.each(store.slots, (_slotRaw, _slotIndex) => {
			const slotRaw = _.cloneDeep(_slotRaw);
			const itemData = ItemData.getInstance().data[slotRaw.name];
			const slotIndex = _slotIndex + 1;
			if (!_.isEmpty(slotRaw.metadata)) {
				_.each(slotRaw.metadata, (value, key) => {
					if (value === "<Serial>") {
						slotRaw.metadata[key] = _.first(uuidv4().split("-"));
					}
				});
			}

			if (!slotRaw.expiresAt) {
				slotRaw.expiresAt = itemData.expiresAt;
			}

			const slot = {
				inventory: "store",
				owner: store.name,
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
			owner: storeName,
			slots: slots,
			totalSlots: 50,
			totalWeight: 2000,
			type: "store",
			label: capitalize(storeName),
		};

		const InventoryObject = new Inventory(inventory);
		return InventoryObject;
	}

	static GetInstance(): ShopInv {
		if (!globalany.ShopInvInstance) {
			globalany.ShopInvInstance = new ShopInv();
		}

		return globalany.ShopInvInstance;
	}
}

export default ShopInv;
