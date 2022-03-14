import _ from "lodash";
import PolyZone from "../PolyZone";
import { qTarget, QTargetOption, QTargetParameters } from "../EyeAction";
import * as types from "@shared/types";
// type Coord = { x: number; y: number; z: number, heading?: number };

const spawnedEntities: { [name: string]: Promise<number> } = {};
const spawnedEntitiesRef: number[] = [];

const Delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export type PedComponentVariation = {
	componentId: number, 
	drawableId: number, 
	textureId: number, 
	paletteId: number
}

export type CreateActionPedReturn = {
	RemoveAction: (actionLabel: string) => void;
	AddAction: (action: QTargetOption) => void;
};

export async function spawnEntity(entity: number, coords: types.Coords, pedComps: PedComponentVariation[] = []): Promise<number> {
	RequestModel(entity);
	while (!HasModelLoaded(entity)) {
		await Delay(10);
	}
	const [, zCoord] = GetGroundZFor_3dCoord(coords.x, coords.y, coords.z, false);
	const ped = CreatePed(4, entity, coords.x, coords.y, zCoord, coords.heading, false, true);
	SetEntityInvincible(ped, true);
	TaskSetBlockingOfNonTemporaryEvents(ped, true);
	FreezeEntityPosition(ped, true);
	pedComps.forEach(comp => {
		SetPedComponentVariation(ped, comp.componentId, comp.drawableId, comp.textureId, comp.paletteId);
	});
	return ped;
}


function CreateActionPed(name: string, coords: types.Coords[] | types.Coords, model: number | string, parameters: QTargetParameters, distance: number = 35.0, pedComponents: PedComponentVariation[] = []): CreateActionPedReturn {
	model = _.isString(model) ? GetHashKey(model) : model;
	if (!Array.isArray(coords)) coords = [coords];
	let isWithinZone = false;

	coords.forEach(coord => {
		const zoneName = `actionPed_${name}_${JSON.stringify(coord)}`;
		PolyZone.AddCircleZone(
			zoneName,
			coord,
			distance,
			async function onEnter() {
				isWithinZone = true;
				spawnedEntities[name] = spawnEntity(+model, coord, pedComponents);
				spawnedEntitiesRef.push(await spawnedEntities[name]);
				await addPedActions();
			},
			async function onLeave() {
				isWithinZone = false;
				if (!spawnedEntities[name]) return;
				if (!(spawnedEntities[name] instanceof Promise)) return;
				
				const entity = await spawnedEntities[name]; 
				removePedActions();
				DeleteEntity(entity);
				delete spawnedEntities[name];
				spawnedEntitiesRef.splice(spawnedEntitiesRef.indexOf(entity), 1);
			},
			{
				useZ: true,
			}
		);
	});


	async function addPedActions() {
		if (!isWithinZone || !spawnedEntities[name]) return;
		if (!(spawnedEntities[name] instanceof Promise)) return;
		qTarget.AddEntityZone(`EntityZone:ActionPed:${name}`, await spawnedEntities[name], {
			useZ: true,
		}, parameters);
	}

	function removePedActions() {
		qTarget.RemoveZone(`EntityZone:ActionPed:${name}`);
	}


	function AddAction(action: QTargetOption) {
		if (parameters.options.find(option => option.label === action.label)) return;
		removePedActions();
		parameters.options.push(action);
		addPedActions();
	}

	function RemoveAction(label: string) {
		removePedActions();
		parameters.options = parameters.options.filter(option => option.label !== label);
		addPedActions();
	}

	return {
		AddAction,
		RemoveAction,
	}
}

on("onResourceStop", (resourceName:string) => {
	if(GetCurrentResourceName() != resourceName) return;
	for(const entity of spawnedEntitiesRef) {
		DeleteEntity(entity);
	} 
});

export default CreateActionPed;
