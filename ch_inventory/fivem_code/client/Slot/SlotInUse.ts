import * as types from "@shared/types";
import * as Cfx from "fivem-js";
import _ from "lodash";
import { SendError, SendSuccess } from "../Notify";
import { triggerSlotEvent } from "./SlotEvents";
import { ItemData } from "../client";

export const Delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const globalAny: any = global;
class SlotInUse {
	slotInUse: types.ISlot | undefined;
	currentWeaponHash: number | undefined;
	private readonly weaponGroups = {
		pistol: 416676503,
		lightsmgs: -957766203,
		lightmachineguns: 1159398588,
		machineguns: 970310034,
		sniper: -1212426201,
		shotgun: 860033945,
		superMachineGun: -1569042529,
	};

	private readonly weaponsRules: { [weaponType: string]: (weaponGroup: number) => boolean } = {
		"ammo-pistol": (weaponGroup: number) => weaponGroup === this.weaponGroups.pistol,
		"ammo-sub": (weaponGroup: number) => weaponGroup === this.weaponGroups.lightsmgs,
		"ammo-shotgun": (weaponGroup: number) => weaponGroup === this.weaponGroups.shotgun,
		"ammo-rifle": (weaponGroup: number) => weaponGroup === this.weaponGroups.machineguns,
		"ammo-lmg": (weaponGroup: number) => {
			return (
				weaponGroup === this.weaponGroups.lightmachineguns ||
				weaponGroup === this.weaponGroups.sniper ||
				weaponGroup === this.weaponGroups.superMachineGun
			);
		},
	};

	constructor() {
		onNet("inventory:reloadWeapon", this.reloadWeapon.bind(this));
		onNet("inventory:useWeapon", this.useWeaponItem.bind(this));
		onNet("inventory:holsterWeapon", this.holsterWeapon.bind(this));

		SetWeaponsNoAutoswap(true);
	}

	holsterWeapon() {
		if (!this.slotInUse) return;
		const itemInUseItem = _.first(this.slotInUse.items);

		const currentAmmo: number = GetAmmoInPedWeapon(
			Cfx.Game.Player.Character.Handle,
			GetHashKey(itemInUseItem.name)
		);

		// send update to update metadata for this weapon
		_.first(this.slotInUse.items).metadata.Ammo = currentAmmo;
		emitNet("inventory:updateMetadata", this.slotInUse);

		Cfx.Game.PlayerPed.removeAllWeapons();
		triggerSlotEvent({
			action: "HOLSTER",
			slot: this.slotInUse,
		});
		this.slotInUse = undefined;
		this.currentWeaponHash = undefined;
	}

	useWeaponItem(slot: types.ISlot | undefined) {
		const item = _.first(slot.items);

		if (this.slotInUse) {
			const isUsingSameSlot =
				slot.slotNumber === this.slotInUse.slotNumber &&
				this.slotInUse.inventory === slot.inventory &&
				this.slotInUse.owner === slot.owner;
			this.holsterWeapon();
			if (isUsingSameSlot) {
				this.slotInUse = undefined;
				this.currentWeaponHash = undefined;
				return;
			}
		}

		Cfx.Game.PlayerPed.giveWeapon(GetHashKey(item.name), item.metadata.Ammo, false, true);
		this.currentWeaponHash = GetHashKey(item.name);
		this.slotInUse = slot;
		triggerSlotEvent({
			action: "ENQUIP",
			slot: this.slotInUse,
		});
	}

	reloadWeapon(ammoSlot: types.ISlot) {
		const ped = Cfx.Game.PlayerPed.Handle;
		const weapon = GetSelectedPedWeapon(ped);
		const weaponGroup = GetWeapontypeGroup(weapon);
		const ammoType: string = _.first(ammoSlot.items).name;
		if (this.slotInUse && weapon) {

			const isAmmoItem = ItemData[this.slotInUse.items[0]?.name]?.ammoItem == ammoSlot.items[0]?.name;
			const weaponRule = this.weaponsRules[ammoType]?.(weaponGroup) ?? isAmmoItem;

			if (!weaponRule) {
				SendError("Våpnet støtter ikke dette kaliberet");

				return;
			}

			const maxAmmoInClip = GetMaxAmmoInClip(ped, weapon, true);

			const currentAmmo = GetAmmoInPedWeapon(ped, weapon);
			if (maxAmmoInClip <= currentAmmo) {
				// not enough space in clip
				SendError("Det er allerede fult i magasinet");
				return;
			}

			const spaceLeft = maxAmmoInClip - currentAmmo;
			const reloadAmount = spaceLeft >= ammoSlot.items.length ? ammoSlot.items.length : spaceLeft;
			emitNet("inventory:RemoveItemFromSlot", ammoSlot, reloadAmount);

			if (currentAmmo > 0) {
				const newReloadAmount = reloadAmount + currentAmmo;
				SetAmmoInClip(ped, weapon, 0);
				AddAmmoToPed(ped, weapon, newReloadAmount);
				SendSuccess(`Du ladet våpnet med ${reloadAmount}`);
			} else {
				AddAmmoToPed(ped, weapon, reloadAmount);
				SendSuccess(`Du ladet våpnet med ${reloadAmount}`);
			}
		}
	}

	async giveWeaponToPlayerIfHandsEmpty() {
		if (this.slotInUse) {
			const ped = Cfx.Game.PlayerPed.Handle;
			const ammo = GetAmmoInPedWeapon(ped, this.currentWeaponHash);
			if (ammo === 0) {
				SetCurrentPedWeapon(ped, this.currentWeaponHash, true);
				SetPedCurrentWeaponVisible(ped, true, false, false, false);
			}
		}
	}

	static getInstance(): SlotInUse {
		if (!globalAny.SlotInUseClient) {
			globalAny.SlotInUseClient = new SlotInUse();
		}
		return globalAny.SlotInUseClient;
	}
}

SlotInUse.getInstance();

export default SlotInUse;
