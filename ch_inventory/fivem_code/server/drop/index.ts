import InventoryActions from "../inventory/InventoryActions";
import _ from "lodash";
import { StaticImplements } from "../utils/decorators";
import * as types from "@shared/types";
@StaticImplements<types.Singelton<Drops>>()
class Drops {
	drops: string[];
	private static instance: Drops;

	constructor() {
		this.drops = [];
	}

	async addDrop(drop: string) {
		this.drops = [...this.drops, drop];

		emitNet("inventory:addDropZone", -1, drop);
	}

	removeDrop(drop: string) {
		this.drops = _.filter(this.drops, (_drop) => !_.isEqual(_drop, drop));
		emitNet("inventory:removeDropZone", -1, drop);
	}

	hasDropZone(drop: string) {
		return this.drops.includes(drop);
	}

	async createOrDeleteDropZone(dropOwner: string) {
		const inventoryActions = InventoryActions.getInstance();
		const hasInventoryLocally = inventoryActions.hasLocalInventory("drop", dropOwner);
		if (hasInventoryLocally) {
			const inventory = await inventoryActions.getInventoryOrFetch("drop", dropOwner);

			if (!inventory.hasSlots() && this.hasDropZone(dropOwner)) {
				// remove dropzone
				this.removeDrop(dropOwner);
				return;
			}

			if (inventory.hasSlots() && !this.hasDropZone(dropOwner)) {
				this.addDrop(dropOwner);
				return;
			}
		}
	}

	static getInstance(): Drops {
		if (!Drops.instance) {
			Drops.instance = new Drops();
		}

		return Drops.instance;
	}
}

export default Drops.getInstance();
