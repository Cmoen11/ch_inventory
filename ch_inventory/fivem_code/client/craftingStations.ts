import * as types from "@shared/types";
import * as _ from "lodash";
import { SendError } from "./Notify";
import CreateActionPed from "./ActionPed";
import PlayDistanceSound from "./Sounds";

function initCraftingZones() {
	const craftingStations: types.CraftingDictionary = JSON.parse(
		LoadResourceFile(GetCurrentResourceName(), "CraftingStations.json")
	);

	_.each(craftingStations, (crafting, index) => {

		CreateActionPed(crafting.name, crafting.coords, crafting.entity, {
			distance: 2.5,
			options: [
				{
					label: crafting.name,
					icon: 'fas fa-drafting-compass',
					action: () => {
						const stats = global.exports['sawu_stats'].getSkillData();
						const hasMissingRequirements = crafting?.skillsRequired?.filter?.(skill => stats[skill.skillName].level < skill.skillValue);

						if (hasMissingRequirements?.length) {
							if (hasMissingRequirements[0]?.sound) {
								PlayDistanceSound(10.0, hasMissingRequirements[0].sound, 0.7);
							}

							SendError(
								`${crafting.name} ønsker ikke å snakke med deg, fordi du ikke er erfaren nok i ${hasMissingRequirements.map(skill => skill.label).join(', ')}`,
								20
							);
							return;
						}
						if (crafting?.sound) {
							PlayDistanceSound(10.0, crafting.sound, 0.7);
						}
						emitNet("inventory:openInventory", "crafting", crafting.name.toLowerCase(), 50, 5000);

					}
				}
			]
		});
	});
}

on("onResourceStart", (resource: string) => {
	if (resource === "ch-inventory") {
		initCraftingZones();
	}
});

onNet("esx:playerLoaded", () => {
	initCraftingZones();
});
