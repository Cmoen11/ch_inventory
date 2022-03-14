import { Client } from "esx.js";

const globalAny: any = global;

class ESXHandler {
	ESX: Client;

	constructor() {
		setImmediate(() => {
			emit("esx:getSharedObject", (obj: any) => {
				this.ESX = obj;
			});
		});
	}

	static getInstance() : ESXHandler{
		if (!globalAny.ESXCLIENT) {
			globalAny.ESXCLIENT = new ESXHandler();
		}
		return globalAny.ESXCLIENT;
	}
}

export default ESXHandler.getInstance();