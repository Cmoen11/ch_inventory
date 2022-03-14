export default function Log(
	source: number,
	message: string,
	logTo: "inventory" | "inv_error" | "butikk" | "crafting",
	metaData: any
) {
	emit("sawu_logs:discord", source, message, logTo, JSON.stringify(metaData));
}
