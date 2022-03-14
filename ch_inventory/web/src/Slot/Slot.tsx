import React from "react";
import * as types from "@shared/types";
import _ from "lodash";
import useGlobalInventoryContext, { InventoryUnit } from "core/GlobalInventoryContext";
import useMousePosition from "hooks/useMousePosition";
import { getDurabilityPrecent2 } from "core/utils";
import { Popover } from "react-tiny-popover";
import {
	CountAndWeight,
	DurabilityBar,
	InvisibleSlotFrame,
	ItemInformationBox,
	SlotFooter,
	SlotFooterSpan,
	SlotFrame,
	SlotImage,
	SlotNumber,
	PriceSpan,
	SlotUseText,
} from "./SlotStyles";
import License from "Description/License";
import labels from "../labels";
import useCoreContext from "core/context/CoreContext";
import { numberformatter } from "utils";
import Badge from "Description/Badge";

function getDurabilityBackgroundColor(durabillityPrecent: number) {
	if (durabillityPrecent >= 70) {
		return "#32485A";
	} else if (durabillityPrecent < 40) {
		return "#BA4040";
	} else if (durabillityPrecent < 70) {
		return "#6A5461";
	}
}

type Props = {
	slot: types.ISlot;
	inventoryUnit: InventoryUnit;
	shakeEffect?: () => void;
	useText?: string;
	className?: string;
};

function InformationBoxComponent(props: Props & { itemData: types.ItemData }) {
	const item = _.first(props.slot.items);

	const isDriverLicense = _.isEqual(item?.name, "drivelicense");
	const isPoliceId = _.isEqual(item?.name, "policeId");

	if (isPoliceId) {
		return <Badge {...item?.metadata} />;
	}

	if (isDriverLicense) {
		return <License {...item?.metadata} />;
	}
	return (
		<ItemInformationBox>
			<h1>{props.itemData.label}</h1>
			<p>{props.itemData.description}</p>
			<div className="info" style={{ width: "100%" }}>
				{props.itemData.label} | Vekt: {props.itemData.itemWeight} | Antall {props.slot.items.length}
			</div>

			<table>
				{item?.metadata &&
					Object.keys(item?.metadata).map((key) => {
						return (
							<tr>
								<td>{key}</td>
								<td>{item?.metadata[key]}</td>
							</tr>
						);
					})}
			</table>
		</ItemInformationBox>
	);
}

function convertStringToDate(value: string | Date | undefined): Date {
	if (!value) return new Date();
	return value instanceof Date ? value : new Date(value);
}

function Slot(props: Props) {
	const { slot, inventoryUnit, shakeEffect, useText } = props;
	const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
	const context = useGlobalInventoryContext();
	const coreContext = useCoreContext();
	const count = React.useMemo(() => {
		if (slot.inventory === "store" && !_.isNumber(context?.moveAmount)) {
			return 1;
		}

		function returnMaxMoveAmount(suggested: number) {
			return suggested > slot.items.length ? slot.items.length : suggested;
		}

		if (!_.isNumber(context?.moveAmount)) {
			return slot.items.length ?? 1;
		}

		return returnMaxMoveAmount(context?.moveAmount ?? slot.items.length);
	}, [context?.moveAmount, slot.items.length, slot.inventory]);

	const firstItemInStack = _.first(slot.items);
	const itemData: types.ItemData | undefined = context?.itemData?.[firstItemInStack?.name ?? ""];
	const expiresAtDate: Date = convertStringToDate(firstItemInStack?.expiresAt);
	const createdDate: Date = convertStringToDate(firstItemInStack?.createdDate);

	const durabillityPrecent = React.useMemo(
		() => firstItemInStack?.expiresAt ? getDurabilityPrecent2(createdDate, expiresAtDate) : 100,
		[firstItemInStack, itemData, context?.hotbarVisible, coreContext.visibility]
	);

	const durabillityColor = React.useMemo(
		() => getDurabilityBackgroundColor(durabillityPrecent),
		[durabillityPrecent]
	);

	function onMouseDown(event: any) {
		const isCrafting = slot.inventory === "crafting";

		if (event.ctrlKey) {
			// split stack in two.
			context?.setHoverSlot?.({
				slot: _.clone(slot),
				count: isCrafting ? slot.items.length : Math.round(slot.items.length / 2),
				unit: _.clone(inventoryUnit),
			});

			return;
		}

		if (event.shiftKey) {
			// should quick move to secoundInventory
			context?.quickMove?.(
				{
					slot: slot,
					count: count,
					unit: inventoryUnit,
				},
				inventoryUnit
			);
			return;
		}

		// normal move.
		context?.setHoverSlot?.({
			slot: _.clone(slot),
			count: isCrafting ? slot.items.length : count ?? 1,
			unit: inventoryUnit,
		});
	}

	function onMouseUp() {
		if (!context?.hoverSlot) return;
		const success = context?.moveItem?.(_.clone(slot), _.clone(inventoryUnit));

		if (!success) {
			shakeEffect?.();
		}
	}

	React.useEffect(() => {
		if (isPopoverOpen) {
			setIsPopoverOpen(false);
		}
	}, [props.slot]);

	const shouldShowSlotNr = slot.slotNumber < 5 && inventoryUnit === "first" && _.isNil(useText);
	if (!firstItemInStack) {
		return (
			<SlotFrame className={props.className ?? ""}>
				<InvisibleSlotFrame onMouseDown={onMouseDown} onMouseUp={onMouseUp} />
				{shouldShowSlotNr && <SlotNumber>{slot.slotNumber}</SlotNumber>}
				<SlotFooter>
					<SlotFooterSpan></SlotFooterSpan>

					<DurabilityBar
						style={{
							width: `${durabillityPrecent >= 0 ? durabillityPrecent : 100}%`,
							backgroundColor: durabillityColor ?? "darkblue",
						}}
					></DurabilityBar>
				</SlotFooter>
			</SlotFrame>
		);
	}

	if (!itemData) return <React.Fragment />;
	const isExpired = durabillityPrecent <= 0;

	const slotWeight = (itemData?.itemWeight * slot.items.length).toFixed(2);

	return (
		<Popover
			isOpen={isPopoverOpen && coreContext.visibility}
			positions={["bottom", "left"]} // preferred positions by priority
			content={<InformationBoxComponent {...props} itemData={itemData} />}
		>
			<SlotFrame onMouseOver={() => setIsPopoverOpen(true)} onMouseOut={() => setIsPopoverOpen(false)}>
				<InvisibleSlotFrame onMouseDown={onMouseDown} onMouseUp={onMouseUp}></InvisibleSlotFrame>
				{shouldShowSlotNr && <SlotNumber>{slot.slotNumber}</SlotNumber>}
				{!_.isNil(useText) && <SlotUseText>{labels[useText]}</SlotUseText>}
				<SlotImage src={itemData?.image} draggable={false} isExpired={isExpired} />
				<CountAndWeight>
					{slot.items.length} ({slotWeight})
				</CountAndWeight>
				<SlotFooter>
					<SlotFooterSpan>{itemData?.label.toUpperCase()}</SlotFooterSpan>
					{slot.inventory === "store" ? (
						<PriceSpan>{numberformatter.format(itemData?.price ?? 0)} </PriceSpan>
					) : (
						<DurabilityBar
							style={{
								width: `${!isExpired ? durabillityPrecent : 100}%`,
								backgroundColor: durabillityColor ?? "darkblue",
							}}
						></DurabilityBar>
					)}
				</SlotFooter>
			</SlotFrame>
		</Popover>
	);
}

export function HoverItem(props: types.ISlot | undefined) {
	const context = useGlobalInventoryContext();
	const pos = useMousePosition();

	if (props === undefined) {
		return null;
	}

	const firstItemInStack = _.first(props.items);
	const itemData: types.ItemData | undefined = context?.itemData?.[firstItemInStack?.name ?? ""];
	const expiresAtDate: Date = convertStringToDate(firstItemInStack?.expiresAt);
	const createdDate: Date = convertStringToDate(firstItemInStack?.createdDate);
	const durabillityPrecent = (() => firstItemInStack?.expiresAt ? getDurabilityPrecent2(createdDate, expiresAtDate) : 100)();
	const durabillityColor = getDurabilityBackgroundColor(durabillityPrecent);
	if (!firstItemInStack || !pos.x || !pos.y) return <React.Fragment />;

	const isExpired = durabillityPrecent <= 0;

	return (
		<div
			style={{
				position: "absolute",
				top: pos.y,
				left: pos.x,
				transform: "scale(0.9) translate(-3vw, -6vh)",
				opacity: 1,
				zIndex: 99,
			}}
		>
			<SlotFrame>
				<SlotImage src={itemData?.image} draggable={false} isExpired={isExpired} />

				<SlotFooter>
					<SlotFooterSpan>{itemData?.label.toUpperCase()}</SlotFooterSpan>
					<DurabilityBar
						style={{
							width: `${!isExpired ? durabillityPrecent : 100}%`,
							backgroundColor: durabillityColor ?? "darkblue",
						}}
					></DurabilityBar>
				</SlotFooter>
			</SlotFrame>
		</div>
	);
}

export default Slot;
