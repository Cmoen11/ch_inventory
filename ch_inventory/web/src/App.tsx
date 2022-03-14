import React from "react";
import "./App.css";
import useCoreContext from "./core/context/CoreContext";
import _ from "lodash";
import Inventory from "./Inventory/Inventory";
import useGlobalInventoryContext from "./core/GlobalInventoryContext";
import styled from "styled-components";
import InventoryActions from "./InventoryActions";
import { useNuiService } from "nui-events/hooks/useNuiService";
import Hotbar from "./Hotbar";
import SlotEvents from "./SlotEvents";
import GiveMenu from "./GiveMenu";

const CoveredBackgroundBlur = styled.div`
	margin: 0;
	padding: 0;
	position: absolute;
	z-index: -99;
	// backdrop-filter: blur(5px);
	width: 100vw;
	height: 100vh;
	background: rgba(0, 0, 0, 0.3);
`;

const InnerContainer = styled.div`
	width: 1510px;
	height: 45vh;
	display: flex;
	justify-content: space-between;
`;

const OuterContainer = styled.div`
	width: 100vw;
	height: 100vh;
	display: flex;
	justify-content: center; /*centers items on the line (the x-axis by default)*/
	align-items: center; /*centers items on the cross-axis (y by default)*/
`;
const CfgGameView = styled.object`
	margin: 0;
	padding: 0;
	position: absolute;
	z-index: -99;
	width: 100vw;
	height: 100vh;
`;

const OuterDiv: any = styled.div`
	visibility: ${(props: any) => (props.visibility ? "visible" : "hidden")};
	opacity: ${(props: any) => (props.visibility ? "1" : 0)};
	transition: visibility 0.3s linear, opacity 0.3s linear;
`;

function App() {
	const { visibility } = useCoreContext();
	const context = useGlobalInventoryContext();

	useNuiService();

	if (!context?.playerInventory || !context?.secoundInventory) {
		return <React.Fragment />;
	}

	return (
		<>
			<OuterDiv visibility={visibility}>
				{/* <CfgGameView type="application/x-cfx-game-view"  /> */}
				<CoveredBackgroundBlur />
				<OuterContainer>
					<InnerContainer>
						<Inventory unit="first" inventory={{ ...context?.playerInventory }} />
						<InventoryActions />
						<Inventory unit="secound" inventory={{ ...context?.secoundInventory }} />
					</InnerContainer>
				</OuterContainer>
			</OuterDiv>
			<SlotEvents />
			<Hotbar />
			<GiveMenu />
		</>
	);
}

export default App;
