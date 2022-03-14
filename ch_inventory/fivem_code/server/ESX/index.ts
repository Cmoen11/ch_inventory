import { Server } from "esx.js";

class ESXHandler {
	private static instance: ESXHandler;
	ESX: Server;

	constructor() {
		setImmediate(() => {
			emit("esx:getSharedObject", (obj: any) => {
				this.ESX = obj;
			});
		});
	}

	static getInstance() {
		if (!ESXHandler.instance) {
			ESXHandler.instance = new ESXHandler();
		}
		return ESXHandler.instance;
	}
}

export default ESXHandler.getInstance();
