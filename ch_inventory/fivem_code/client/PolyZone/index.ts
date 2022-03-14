const globalAny: any = global;
type Coords = { x: number; y: number; z: number };
type CallbackFunction = (polyName: string) => void;

class PolyZone {
	zones: { name: string; onEnter: CallbackFunction; onExit: CallbackFunction }[] = [];

	constructor() {
		on("bt-polyzone:enter", (name: string) => this.zones.find((z) => z.name === name)?.onEnter?.(name));
		on("bt-polyzone:exit", (name: string) => this.zones.find((z) => z.name === name)?.onExit?.(name));
	}

	/**
	 *
	 * @param name the reference name of the zone
	 * @param coord coords for the zone
	 * @param length length of the zone
	 * @param height height of the zone
	 * @param onEnter function that gets invoked when the player enter the zone
	 * @param onExit function that gets invoked when the player leaves the zone
	 * @param options optional parameters
	 */
	AddBoxZone(
		name: string,
		coord: Coords,
		length: number,
		height: number,
		onEnter: CallbackFunction,
		onExit: CallbackFunction,
		options: {
			debugPoly?: boolean;
			heading?: number;
			offset?: [number, number, number];
			scale?: [number, number, number];
		}
	) {
		if (this.zones.some((z) => z.name === name)) {
			throw new Error("Zone " + name + " already exists");
		}

		global.exports["bt-polyzone"].AddBoxZone(name, coord, length, height, {
			name: name,
			...options,
		});

		this.zones.push({ name, onEnter, onExit });
	}

	/**
	 *
	 * @param name the reference name of the zone
	 * @param coord coords for the zone
	 * @param radius radius of the zone
	 * @param onEnter function that gets invoked when the player enter the zone
	 * @param onExit function that gets invoked when the player leaves the zone
	 * @param options optional parameters
	 */
	AddCircleZone(
		name: string,
		coord: Coords,
		radius: number,
		onEnter: CallbackFunction,
		onExit: CallbackFunction,
		options?: { useZ?: boolean; debugPoly?: boolean }
	) {
		if (this.zones.some((z) => z.name === name)) {
			throw new Error("Zone " + name + " already exists");
		}

		global.exports["bt-polyzone"].AddCircleZone(name, coord, radius, {
			name,
			...options,
		});

		this.zones.push({ name, onEnter, onExit });
	}

	/**
	 *
	 * @param name Removes the zone
	 */
	RemoveZone(name: string) {
		this.zones = this.zones.filter((z) => z.name !== name);
		global.exports["bt-polyzone"].RemoveZone(name);
	}

	/**
	 *
	 * @returns singelton object of PolyZone
	 */
	static getInstance(): PolyZone {
		if (globalAny.PolyZone) {
			return globalAny.PolyZone;
		}
		globalAny.Poly = new PolyZone();
		return globalAny.Poly;
	}
}

export default PolyZone.getInstance();
