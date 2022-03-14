import * as types from "@shared/types";
export function triggerSlotEvent(slotEvent: types.SlotEvent) {
    SendNuiMessage(
        JSON.stringify({
            app: "SlotEvent",
            method: "addSlotEvent",
            data: slotEvent,
        })
    );
}