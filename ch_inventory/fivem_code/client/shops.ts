import * as types from "@shared/types";
import * as _ from "lodash";
import PlayDistanceSound from "./Sounds";
import CreateActionPed from "./ActionPed";
import { World, Blip, Vector3 } from "fivem-js";
import { SendError } from "./Notify";

const stores: types.ShopDictionary = JSON.parse(LoadResourceFile(GetCurrentResourceName(), "Stores.json"));
_.each(stores, CreateShopPed);

function CreateShopPed(store: types.ShopEntity) {
	CreateActionPed(
		store.name,
		store.coords,
		store.entity,
		{
			distance: 2.5,
			options: [
				{
					label: store.name,
					icon: "fas fa-drafting-compass",
					action: () => {
						const stats = global.exports["sawu_stats"].getSkillData();
						const hasMissingRequirements = store?.skillsRequired?.filter?.(
							(skill) => stats[skill.skillName].level < skill.skillValue
						);

						if (hasMissingRequirements?.length) {
							if (hasMissingRequirements[0]?.sound) {
								PlayDistanceSound(10.0, hasMissingRequirements[0].sound, 0.7);
							}
							const missingRequirements = hasMissingRequirements.map((skill) => skill.label).join(", ");
							const message = `${store.name} ønsker ikke å snakke med deg. Mangler ${missingRequirements}`;

							SendError(message, 20);
							return;
						}

						emitNet("inventory:openInventory", "store", store.name.toLowerCase(), 50, 5000);

						if (store?.sound) {
							PlayDistanceSound(10.0, store?.sound, 0.7);
						}
					},
				},
			],
		},
		35.0,
		store.pedComps
	);

	if (store.blip) {
		store.coords.forEach((coord) => {
			// Adding shop markers
			let blip: Blip = World.createBlip(new Vector3(coord.x, coord.y, coord.z));
			blip.Sprite = store.blip.sprite;
			blip.Color = store.blip.color;
			blip.Display = store.blip.display;
			blip.Name = store.name;
			blip.Scale = store.blip.scale;
			blip.IsShortRange = true;
		});
	}
}
