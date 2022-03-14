export function SendError(message: string, duration: number = 15) {
	global.exports["mythic_notify"].DoHudText("error", message, duration);
}

export function SendInform(message: string) {
	global.exports["mythic_notify"].DoHudText("inform", message);
}

export function SendSuccess(message: string) {
	global.exports["mythic_notify"].DoHudText("success", message);
}

export default {
	SendError,
	SendInform,
	SendSuccess,
};
