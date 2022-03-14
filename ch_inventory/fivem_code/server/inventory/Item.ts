import * as types from "@shared/types";
import ItemData from "../ItemData";
import { getDurabilityPrecent } from "./Inventory";

function parseStringToDate(date: string | Date): Date {
	if (date instanceof Date) return date;
	return new Date(date);
}

class Item implements types.Item {
	name: string;
	metadata?: any;
	expiresAt?: string | Date;
	createdDate: string | Date;
	itemData: types.ItemData;

	constructor(itemData: types.Item) {
		this.name = itemData.name;
		this.metadata = itemData.metadata;
		this.expiresAt = itemData.expiresAt;
		this.createdDate = itemData.createdDate;
		this.itemData = ItemData.getInstance().data[this.name];
	}

	sanitizeObject(): types.Item {
		return {
			name: this.name,
			metadata: this.metadata,
			expiresAt: this.expiresAt ? parseStringToDate(this.expiresAt) : null,
			createdDate: parseStringToDate(this.createdDate),
		};
	}

	get createdDateDateObject(): Date {
		return parseStringToDate(this.expiresAt);
	}

	getDurabilityPrecent(): number {
		if(!this.createdDate || !this.expiresAt) return 100;
		return getDurabilityPrecent(parseStringToDate(this.createdDate), parseStringToDate(this.expiresAt));
	}

	isExpired(): boolean {
		return this.getDurabilityPrecent() <= 0;
	}
}

export default Item;
