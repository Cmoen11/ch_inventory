import * as types from "@shared/types";
import dayjs from "dayjs";
import Item from "../inventory/Item";
import ESXHandler from "../ESX";

export function getDiffInSecounds(date: Date) {
	if (!date?.getTime?.()) {
		date = new Date(date);
	}

	const dif = new Date().getTime() - date?.getTime?.();

	const Seconds_from_T1_to_T2 = dif / 1000;
	const Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);

	if (dayjs(date).isBefore(dayjs())) {
		return -Math.floor(Seconds_Between_Dates);
	}

	return Math.floor(Seconds_Between_Dates);
}

export function getDurabilityPrecent(expiresDays: number, expiresAt: Date): number {
	if (!expiresAt) return 100;
	const totalDurableSeconds = getDiffInSecounds(dayjs().add(expiresDays, "day").toDate());
	const expiresAtSecounds = getDiffInSecounds(expiresAt ?? new Date());

	return 100 - parseFloat(((expiresAtSecounds / totalDurableSeconds) * 100).toFixed(2));
}

export function getDurabilityPrecent2(createdDate: Date, expiresAt: Date): number {
	if (!expiresAt) return 100;
	const secoundsBetweenCreatedAtAndExpiresAt: number = dayjs(expiresAt).unix() - dayjs(createdDate).unix();
	const secoundsBetweenCurrentDataAndExpiresAt: number = dayjs(expiresAt).unix() - dayjs().unix();

	if (secoundsBetweenCurrentDataAndExpiresAt <= 0) return 0;

	return (
		100 -
		(100 -
			parseFloat(
				((secoundsBetweenCurrentDataAndExpiresAt / secoundsBetweenCreatedAtAndExpiresAt) * 100).toFixed(2)
			))
	);
}

export function sortItems(items: types.Item[]) {
	return items.sort(
		(a, b) =>
			getDurabilityPrecent2(
				a.createdDate instanceof String ? new Date(a.createdDate) : <Date>a.createdDate,
				a.expiresAt ? (a.expiresAt instanceof String ? new Date(a.expiresAt) : <Date>a.expiresAt) : null
			) -
			getDurabilityPrecent2(
				b.createdDate instanceof String ? new Date(b.createdDate) : <Date>b.createdDate,
				b.expiresAt ? (b.expiresAt instanceof String ? new Date(b.expiresAt) : <Date>b.expiresAt) : null
			)
	);
}

export const capitalize = (s: string) => {
	if (typeof s !== "string") return "";
	return s.charAt(0).toUpperCase() + s.slice(1);
};

export function addSlotEvent(source: any, slot: types.ISlot, action: types.SlotEventTypes) {
	const slotEvent: types.SlotEvent = {
		action: action,
		slot: {
			...slot,
			items: slot.items.map((item) => {
				const _item = new Item(item);
				return _item.sanitizeObject();
			}),
		},
	};
	emitNet("inventory:addSlotEvent", source, slotEvent);
}

const getDistance = (plyCoords: types.Coord, tgtCoords: types.Coord) => {
	return Math.hypot(plyCoords[0] - tgtCoords[0], plyCoords[1] - tgtCoords[1]);
};

export function getNearbyPlayers(source: string, proximity: number = 25): types.NearbyPlayer[] {
	const plyCoords = <types.Coord>GetEntityCoords(GetPlayerPed(source));

	return getPlayers()
		.reduce((prev, curr) => {
			if (curr.toString() === source.toString()) return prev;

			const currCoords = <types.Coord>GetEntityCoords(GetPlayerPed(curr));
			const distance = getDistance(plyCoords, currCoords);

			if (distance > proximity) {
				return prev;
			}

			const xPlayer = ESXHandler.ESX.GetPlayerFromId(curr);

			const returnObject: types.NearbyPlayer = {
				distance: distance,
				serverId: curr,
				coords: currCoords,
				charName: xPlayer.charname,
			};

			return [...prev, returnObject];
		}, [])
		.sort((a, b) => a.distance - b.distance);
}

export default sortItems;
