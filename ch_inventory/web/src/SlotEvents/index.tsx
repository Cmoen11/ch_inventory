import React, { Fragment } from "react";
import * as types from "@shared/types";
import * as _ from "lodash";
import Slot from "Slot/Slot";
import styled from "styled-components";
import FadeIn from "react-fade-in";
import { useNuiEvent } from "../nui-events/hooks/useNuiEvent";

const SlotEventsContainer: any = styled.div`
	width: 100%;
	position: absolute;
	height: 250px;
	bottom: 0;
	display: flex;
	justify-content: center;
`;

const SlotEventsInner: any = styled.div`
	display: flex;
	justify-content: center;
	space-between: 2px;
	width: 400px;
	height: 160px;
	transform: scale(0.9);
`;

function SlotEvent(slotEvent: types.SlotEvent) {
	const [isVisible, setIsVisible] = React.useState<boolean>(true);
	const [isDeleted, setIsDeleted] = React.useState<boolean>(false);

	React.useEffect(() => {
		setTimeout(() => {
			setIsVisible(false);
		}, 2000);
		setTimeout(() => {
			setIsDeleted(true);
		}, 2500);
	}, []);

	if (isDeleted) {
		return <Fragment />;
	}

	return (
		<FadeIn visible={isVisible}>
			<Slot slot={{ ...slotEvent.slot }} inventoryUnit="first" useText={slotEvent.action} />
		</FadeIn>
	);
}

function SlotEvents() {
	const [slotEvents, setSlotEvents] = React.useState<types.SlotEvent[]>([]);

	function addSlotEvent(event: types.SlotEvent) {
		setSlotEvents([...slotEvents, event]);
	}

	useNuiEvent("SlotEvent", "addSlotEvent", addSlotEvent);

	return (
		<SlotEventsContainer>
			<SlotEventsInner>
				{slotEvents.map((slotEvent) => {
					return <SlotEvent {...slotEvent} />;
				})}
			</SlotEventsInner>
		</SlotEventsContainer>
	);
}

export default SlotEvents;
