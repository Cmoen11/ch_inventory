import * as types from "@shared/types";

const globalAny: any = global;
class ItemData {
	data: types.ItemDataHashMap;

	constructor() {
		this.data = JSON.parse(LoadResourceFile(GetCurrentResourceName(), "ItemData.json"));

		on("playerJoining", () => {
			const source = (global as any).source;
			emitNet("inventory:updateItemData", source, this.data);
		});

		onNet("inventory:updateItemData", () => {
			const source = (global as any).source;
			emitNet("inventory:updateItemData", source, this.data);
		});
	}

	static getInstance(): ItemData {
		if (!globalAny.ItemData) {
			globalAny.ItemData = new ItemData();
		}
		return globalAny.ItemData;
	}
}

ItemData.getInstance();
export default ItemData;
