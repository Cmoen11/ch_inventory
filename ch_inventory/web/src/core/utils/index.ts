import * as types from "@shared/types";
import dayjs from "dayjs";

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

export function getDurabilityPrecent2(createdDate: Date, expiresAt: Date | null): number {
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
				a.createdDate instanceof String ? new Date(a.createdDate) : a.createdDate as Date,
				a.expiresAt ? (a.expiresAt instanceof String ? new Date(a.expiresAt) : a.expiresAt as Date) : null
			) -
			getDurabilityPrecent2(
				b.createdDate instanceof String ? new Date(b.createdDate) : b.createdDate as Date,
				b.expiresAt ? (b.expiresAt instanceof String ? new Date(b.expiresAt) : b.expiresAt as Date) : null
			)
	);
}

export function addZeroes(num: number) {
	const dec = num.toString().split(".")[1];
	const len = dec && dec.length > 2 ? dec.length : 2;
	return Number(num).toFixed(len);
}
