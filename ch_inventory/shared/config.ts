import { ItemDataHashMap, IWeightConfig } from "./types";

export const WeightConfig: IWeightConfig = {
	player: 120,
	stash: 120,
	trunk: 120,
	glowbox: 120,
};

export const ItemData: ItemDataHashMap = {
	rings: {
		name: "rings",
		label: "Løkringer",
		image: "https://i.imgur.com/tdmlYbh.png",
		itemWeight: 1,
		description: "",
		expiresDays: 30,
	},
	WEAPON_FIREEXTINGUISHER: {
		name: "WEAPON_FIREEXTINGUISHER",
		label: "Brannskum",
		image: "https://i.imgur.com/zSvB2WO.png",
		itemWeight: 10,
		description: "",
		expiresDays: 30,
	},
};
