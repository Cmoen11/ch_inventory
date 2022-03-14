import React from "react";
import * as types from "@shared/types";
import * as _ from "lodash";
import useGlobalInventoryContext from "core/GlobalInventoryContext";
import Slot from "Slot/Slot";
import styled from "styled-components";
import FadeIn from "react-fade-in";

const HotbarContainer = styled.div`
	position: absolute;
	bottom: 0;
	display: flex;
	align-items: center;
	width: 100%;
`;

const HotbarInner = styled.div`
	display: flex;
	justify-content: space-arou;
	margin: 0 auto auto;
	transform: scale(0.9);
`;

function Hotbar() {
	const context = useGlobalInventoryContext();
	if (!context) {
		return <React.Fragment />;
	}

	const inventory = context.playerInventory;

	if (!inventory) {
		return <React.Fragment />;
	}
	return (
		<FadeIn visible={context.hotbarVisible}>
			<HotbarContainer>
				<HotbarInner>
					{_.times(5, (index) => {
						index = index + 1; // to keep correct slot number
						const slotData: types.ISlot = {
							slotNumber: index,
							inventory: inventory.type,
							owner: inventory.owner,
							items: inventory?.slots?.[index]?.items ?? [],
						};

						return <Slot key={index} slot={{ ...slotData }} inventoryUnit="first" />;
					})}
				</HotbarInner>
			</HotbarContainer>
		</FadeIn>
	);
}

export default Hotbar;
