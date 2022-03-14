import ESXHandler from "./ESX";
import * as Cfx from "fivem-js";
import { qTarget } from "./EyeAction";

const globalAny: any = global;

enum CarTypes {
	Compacts,
	Sedans,
	SUVs,
	Coupes,
	Muscle,
	"Sports Classic",
	Sports,
	Super,
	Motorcycle,
	"Off-road",
	Industrial,
	Utility,
	Vans,
	Cycles,
	Boats,
	Helicopter,
	Planes,
	Service,
	Emergency,
	Military,
	Commercial,
}

export const Delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

class Trunk {
	trunkOpen: number = undefined;
	weightConfig: { [type: string]: { weight: number; slotCount: number } };

	constructor() {
		this.weightConfig = {
			Compacts: { weight: 300, slotCount: 50 },
			Sedans: { weight: 300, slotCount: 50 },
			SUVs: { weight: 400, slotCount: 50 },
			Coupes: { weight: 300, slotCount: 50 },
			Muscle: { weight: 200, slotCount: 50 },
			"Sports Classic": { weight: 50, slotCount: 50 },
			Sports: { weight: 100, slotCount: 50 },
			Super: { weight: 10, slotCount: 50 },
			Motorcycle: { weight: 0, slotCount: 50 },
			"Off-road": { weight: 400, slotCount: 50 },
			Industrial: { weight: 100, slotCount: 50 },
			Utility: { weight: 400, slotCount: 50 },
			Vans: { weight: 500, slotCount: 50 },
			Cycles: { weight: 0, slotCount: 50 },
			Boats: { weight: 250, slotCount: 50 },
			Helicopter: { weight: 0, slotCount: 50 },
			Planes: { weight: 0, slotCount: 50 },
			Service: { weight: 0, slotCount: 50 },
			Emergency: { weight: 500, slotCount: 50 },
			Military: { weight: 0, slotCount: 50 },
			Commercial: { weight: 500, slotCount: 50 },
		};

		RegisterCommand("+openTrunk", this.openTrunk.bind(this), false);
		RegisterKeyMapping("+openTrunk", "For å åpne bagasjerommet", "keyboard", "k");
		onNet("inventory:trunkClosed", this.closeTrunk.bind(this));

		/* EyeTarget.AddTargetBone<any>(["boot"], "fas fa-archive", "Åpne bagasjerommet", ["all"], null, 2.5, () =>
			this.openTrunk()
		); */

		qTarget.AddTargetBone('boot', {
			distance: 2.5,
			options: [
				{
					label: 'Åpne bagasjerommet',
					icon: 'fas fa-archive',
					action: () => this.openTrunk(),
				}
			]
		});
	}

	async CloseTrunkAnim() {
		const ped = Cfx.Game.PlayerPed.Handle;
		const animDict = "anim@heists@fleeca_bank@scope_out@return_case";
		const anim = "trevor_action";
		while (!HasAnimDictLoaded(animDict)) {
			RequestAnimDict(animDict);
			await Delay(10);
		}
		ClearPedTasks(ped);
		await Delay(100);
		const [x, y, z] = GetEntityCoords(ped, true);
		TaskPlayAnimAdvanced(ped, animDict, anim, x, y, z, 0, 0, GetEntityHeading(ped), 2.0, 2.0, 1000, 49, 0.25, 0, 0);
		await Delay(900);
		ClearPedTasks(ped);
		SetVehicleDoorShut(this.trunkOpen, 5, false);
	}

	async Anim(dict: string, anim: string, duration: number) {
		while (!HasAnimDictLoaded(dict)) {
			RequestAnimDict(dict);
			await Delay(10);
		}

		TaskPlayAnim(PlayerPedId(), dict, anim, 1.0, -1.0, duration, 49, 0, false, false, false);
	}

	async openTrunk() {
		const vehicle: number = ESXHandler.ESX.Game.GetVehicleInDirection();
		if (DoesEntityExist(vehicle)) {
			const lockStatus = GetVehicleDoorLockStatus(vehicle);
			const locked = lockStatus === 2 || lockStatus === 4;
			const hasBoot = DoesVehicleHaveDoor(vehicle, 5);
			if (!locked && hasBoot) {
				const boneIndex = GetEntityBoneIndexByName(vehicle, "boot");
				const [x, y, z] = GetWorldPositionOfEntityBone(vehicle, boneIndex);
				const [playerX, playerY, playerZ] = GetEntityCoords(Cfx.Game.PlayerPed.Handle, true);
				const distance = GetDistanceBetweenCoords(x, y, z, playerX, playerY, playerZ, true);
				const vehConfig = this.weightConfig[CarTypes[GetVehicleClass(vehicle)]];
				if (distance < 3) {
					const owner = GetVehicleNumberPlateText(vehicle);
					this.trunkOpen = vehicle;
					SetVehicleDoorOpen(vehicle, 5, false, false);
					TriggerServerEvent(
						"inventory:openInventory",
						"trunk",
						owner,
						vehConfig.slotCount,
						vehConfig.weight,
						"🚗 " + owner
					);

					if (!IsEntityPlayingAnim(Cfx.Game.PlayerPed.Handle, "mini@repair", "fixing_a_player", 3)) {
						await this.Anim("mini@repair", "fixing_a_player", -1);
					}
				}
			}
		}
	}

	async closeTrunk() {
		if (this.trunkOpen) {
			// SetVehicleDoorShut(this.trunkOpen, 5, false);
			await this.CloseTrunkAnim();
			this.trunkOpen = undefined;
			ClearPedSecondaryTask(Cfx.Game.PlayerPed.Handle);
		}
	}

	static getInstance(): Trunk {
		if (!globalAny.trunkInstance) {
			globalAny.trunkInstance = new Trunk();
		}

		return globalAny.trunkInstance;
	}
}

export default Trunk.getInstance();
