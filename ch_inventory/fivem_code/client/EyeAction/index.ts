import _ from "lodash";
type Coords = { x: number; y: number; z: number };
export interface QTargetModelProps<T = unknown> {
	models: T[];
	label: string;
	icon: string;
	job?: { [key: string]: number } | string;
	distance?: number;
	optionalParams?: object;
	entity?: number;
}

export interface QTargetEntityProps {
    label: string;
    icon: string;
    job?: { [key: string]: number } | string;
    distance?: number;
    optionalParams?: object;
}
export interface QTargetOption {
	// Parameters
    label: string
    event?: string
	action?: (entity: number) => void
    
    // Optional
    icon?: string
    job?: {[jobName: string]: number} | string
	citizenid?: string
	distance?: number
    item?: string
    canInteract?: (entity: number) => boolean
    
	// Extra data you may need
	[prop: string]: any
}

export interface QTargetParameters {
    options: QTargetOption[]
    distance: number
}

export interface PolyZoneOptions {
    name?: string
    minZ?: number
    maxZ?: number
    gridDivision?: number
    debugGrid?: boolean
    lazyGrid?: boolean
    debugPoly?: boolean
    debugColors?: [number, number, number] | { walls?: [number, number, number], outline?: [number, number, number], grid?: [number, number, number] }
    data?: any
}
export interface BoxZoneOptions {
    heading?: number
    offset?: [number, number, number] | [number, number, number, number, number, number]
    scale?: [number, number, number],
	debugPoly?: boolean
}

export interface CircleZoneOptions {
    useZ?: boolean
    debugColors?: [number, number, number]
}

export interface EntityZoneOptions {
    useZ?: boolean
    debugPoly?: boolean
}

export const qTarget = {
    AddTargetModel(models: number[] | number, parameters: QTargetParameters) {
        global.exports["qtarget"].AddTargetModel(_.isArray(models) ? models : [models], parameters);
    },

    AddTargetBone(bones: string[] | string, parameters: QTargetParameters) {
        global.exports["qtarget"].AddTargetBone(_.isArray(bones) ? bones : [bones], parameters);
    },

    AddTargetEntity(entity: number, parameters: QTargetParameters) {
        global.exports["qtarget"].AddTargetEntity(entity, parameters);
    },
    
    AddEntityZone(name: string, entity: number, options:EntityZoneOptions, parameters: QTargetParameters) {
        global.exports["qtarget"].AddEntityZone(name, entity, options, parameters);
    },
    
    AddPolyZone(name: string, points: Coords[], options: PolyZoneOptions, parameters: QTargetParameters) {
        global.exports["qtarget"].AddPolyZone(name, points, options, parameters);
    },

    AddBoxZone(name: string, center: Coords, length: number, width: number, options: BoxZoneOptions, parameters: QTargetParameters) {
		console.log({center, length, width});
        global.exports["qtarget"].AddBoxZone(name, center, length, width, options, parameters);
    },

    AddCircleZone(name: string, center: Coords, radius: number, options: CircleZoneOptions, parameters: QTargetParameters) {
        global.exports["qtarget"].AddCircleZone(name, center, radius, options, parameters);
    },
    
    AddPed(parameters: QTargetParameters) {
        global.exports["qtarget"].Ped(parameters);
    },
    
    AddVehicle(parameters: QTargetParameters) {
        global.exports["qtarget"].Vehicle(parameters);
    },
    
    AddObject(parameters: QTargetParameters) {
        global.exports["qtarget"].Object(parameters);
    },


    RemoveZone(name: string) {
        global.exports["qtarget"].RemoveZone(name);
    },

    RemoveTargetModel(models: number[] | number, labels: string[] | string) {
        global.exports["qtarget"].RemoveTargetModel(_.isArray(models) ? models : [models], _.isArray(labels) ? labels : [labels]);
    },

	RemoveTargetBone(bones: string[] | string, labels: string[] | string) {
		global.exports["qtarget"].RemoveTargetBone(_.isArray(bones) ? bones : [bones], _.isArray(labels) ? labels : [labels]);
	},

    RemoveTargetEntity(entity: number, labels: string[] | string) {
        global.exports["qtarget"].RemoveTargetEntity(entity, _.isArray(labels) ? labels : [labels]);
    },

    RemovePed(labels: string[] | string) {
        global.exports["qtarget"].RemovePed(_.isArray(labels) ? labels : [labels]);
    },

    RemoveVehicle(labels: string[] | string) {
        global.exports["qtarget"].RemoveVehicle(_.isArray(labels) ? labels : [labels]);
    },

    RemoveObject(labels: string[] | string) {
        global.exports["qtarget"].RemoveObject(_.isArray(labels) ? labels : [labels]);
    },

    RemovePlayer(labels: string[] | string) {
        global.exports["qtarget"].RemovePlayer(_.isArray(labels) ? labels : [labels]);
    },
}