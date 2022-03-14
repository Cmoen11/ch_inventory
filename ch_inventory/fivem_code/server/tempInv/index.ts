import * as types from "@shared/types";
import InventoryActions from "../inventory/InventoryActions";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import _ from "lodash";
import ItemData from "../ItemData";

type ItemType = {
	itemId: string;
	count: number;
	expireDate?: types.ExpireDateObjectType;
	metaData: any;
};

class TempInv {
	private static Instance: TempInv;

	constructor() {
		global.exports("CreateTempInv", this.createTempInv.bind(this));
	}

	createTempInv(label: string, items: ItemType[], type: types.InventoryTypes = "temp") {
		const inventoryOwner = uuidv4();
		const inventoryType = type;
		const slots: types.InventorySlotType = {};
		items.forEach((slotRaw, index) => {
			const itemData = ItemData.getInstance().data[slotRaw.itemId];

			if (!slotRaw.expireDate) {
				slotRaw.expireDate = itemData.expiresAt;
			}

			const _expireDate = slotRaw.expireDate ? dayjs().add(slotRaw.expireDate.amount, slotRaw.expireDate.ofWhat).toDate() : null;

			_.each(slotRaw.metaData, (value, key) => {
				if (value === "<Serial>") {
					slotRaw.metaData[key] = uuidv4().split("-")[0];
				}
			});

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
			};

			slots[index + 1] = slot;
		});

		InventoryActions.getInstance().createInventory(inventoryType, inventoryOwner, label, slots);

		return {
			type: inventoryType,
			owner: inventoryOwner,
		};
	}

	static getInstance(): TempInv {
		if (!TempInv.Instance) {
			TempInv.Instance = new TempInv();
		}

		return TempInv.Instance;
	}
}

TempInv.getInstance();

export default TempInv;
