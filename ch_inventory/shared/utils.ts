import * as types from "./types";

export function sortItemSlot(slot: types.ISlot) {
	// should sort the stack based on expiresAt property
	if (!slot?.items) {
		return slot;
	}
}
