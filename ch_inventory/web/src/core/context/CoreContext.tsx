import useKeypress from "hooks/useKeyPress";
import { useNuiService } from "nui-events/hooks/useNuiService";
import Nui from "nui-events/utils/Nui";
import * as React from "react";
import { useNuiEvent } from "../../nui-events/hooks/useNuiEvent";

export interface ICoreContext {
	visibility: boolean;
	setVisiblity: (newState: boolean) => void;
}

export const CoreContext = React.createContext<ICoreContext | undefined>(undefined);

export function CoreContextProvider({ children }) {
	const [visibility, setVisiblity] = React.useState(
		() => !process.env.NODE_ENV || process.env.NODE_ENV === "development"
	);
	const value = { visibility, setVisiblity };

	useNuiService();
	useNuiEvent("REACTNUI", "setVisibility", setVisiblity);

	return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
}

export default function useCoreContext() {
	const value = React.useContext(CoreContext);
	if (!value) {
		throw new Error("useCoreContext: Must be used within a CoreContextProvider.");
	}

	return value;
}
