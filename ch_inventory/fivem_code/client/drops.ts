import * as types from "@shared/types";
import * as _ from "lodash";
import PolyZone from "./PolyZone";

let insideZone: string = undefined;
const spawnedProps: { [zone: string]: number } = {};

export const Delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function spawnEntity(entity: string | number, coords: Omit<types.Coords, "heading">): Promise<number> {
	const _entity = _.isString(entity) ? GetHashKey(entity) : entity;

	RequestModel(_entity);
	while (!HasModelLoaded(_entity)) {
		await Delay(10);
	}

	const object = CreateObjectNoOffset(_entity, coords.x, coords.y, coords.z, false, false, true);
	PlaceObjectOnGroundProperly(object);
	FreezeEntityPosition(object, true);
	SetModelAsNoLongerNeeded(_entity);

	return object;
}

onNet("inventory:addDropZone", async (dropString: string) => {
	const [, x, y, z] = dropString.split("_");
	spawnedProps[dropString] = await spawnEntity("prop_med_bag_01", {
		x: parseFloat(x),
		y: parseFloat(y),
		z: parseFloat(z),
	});

	PolyZone.AddCircleZone(
		`drop_${dropString}`,
		{ x: parseInt(x), y: parseInt(y), z: parseInt(z) },
		2,
		function onEnter(name: string) {
			global.exports["sawu_ui"].SendActionText(true, "Dropzone", "Her ligger det noe på bakken");
			emit("inventory:insideDropZone", name.replace("drop_", ""));
			insideZone = name.replace("drop_", "");
		},
		function onExit() {
			global.exports["sawu_ui"].SendActionText(false);
			TriggerEvent("inventory:isOutsideDropZone");
			insideZone = undefined;
		}
	);
});

onNet("inventory:removeDropZone", (dropString: string) => {
	PolyZone.RemoveZone(`drop_${dropString}`);
	if (insideZone === dropString) {
		global.exports["sawu_ui"].SendActionText(false);
		TriggerEvent("inventory:isOutsideDropZone");
	}
	DeleteEntity(spawnedProps[dropString]);
	delete spawnedProps[dropString];
});
