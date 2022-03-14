import React from "react";
import * as types from "@shared/types";
import styled, { keyframes, css } from "styled-components";
import _ from "lodash";
import Slot from "Slot/Slot";
import { addZeroes } from "core/utils";
import useGlobalInventoryContext, { InventoryUnit } from "../core/GlobalInventoryContext";
import usePrevious from "hooks/usePrevious";
import classNames from "classnames";

const shakeAnimation = keyframes`
	10%, 90% {
		transform: translate3d(-1px, 0, 0);
	}
	
	20%, 80% {
		transform: translate3d(2px, 0, 0);
	}

	30%, 50%, 70% {
		transform: translate3d(-4px, 0, 0);
	}

	40%, 60% {
		transform: translate3d(4px, 0, 0);
	}
`;

const blinkRed = keyframes`
 50% { border-color:#BA4040 ; }  }
`;

const load = (props: any) => keyframes`
    0% {
        width : ${props.prevWeightIndicator}%
    }
    100% {
        width : ${props.weightIndicatorWidth}%
    }
`;

const WeightIndicator: any = styled.div`
	position: absolute;
	width: 348px;
	height: 16px;
	left: 0px;
	bottom: 0px;
	background: linear-gradient(to right, #689f38a9, #f2a265b0 600px);

	border-radius: 0px 12px 12px 12px;
	animation: ${(props) => load(props)} 0.5s normal forwards;

	span {
		font-family: Acme;
		color: white;
		font-size: 10px;
		padding-right: 10px;
		float: right;
	}
`;
function Loader({ totalWeight, weightIndicatorWidth, alert }) {
	const prevWeightIndicator = usePrevious(weightIndicatorWidth);

	return (
		<WeightContainer alert={alert}>
			<span>{addZeroes(totalWeight)}</span>

			<WeightIndicator prevWeightIndicator={prevWeightIndicator} weightIndicatorWidth={weightIndicatorWidth}>
				<span>{weightIndicatorWidth.toFixed(2)}</span>
			</WeightIndicator>
		</WeightContainer>
	);
}

const InventoryOuter = styled.div`
	padding: 10px;
	padding-left: 25px;
`;

const InventoryContainer = styled.div`
	display: flex;
	width: 573px;
	justify-content: space-between;
	flex-wrap: wrap;
`;

const IventoryLeft: any = styled.div`
	height: 100%;
	width: 590px;
	overflow-y: scroll;
	${(props: any) =>
		props.shaking &&
		css`
			animation: ${shakeAnimation} 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
		`}
`;

const InventoryTitle = styled.span`
	font-family: "Rubik", sans-serif;
	font-size: 22px;
	font-weight: 400;
	color: white;
	text-transform: capitalize;
`;

const WeightContainer: any = styled.div`
	position: relative;
	width: 573px;
	height: 28px;
	margin-bottom: 5px;

	background: #1a1d25;
	border-radius: 0px 0px 12px 12px;

	border: 2px transparent solid;

	${(props: any) =>
		props.alert &&
		css`
			animation: ${blinkRed} 1s;
			animation-iteration-count: 3;
		`}

	span {
		font-family: Acme;
		color: white;
		font-size: 10px;
		float: right;
		padding-right: 5px;
	}
`;

const CraftingSlotContainer = styled.div`
	display: flex;
	width: 275px;
	height: 150px;
	background: red;
	padding: 5px;
	margin-bottom: 7px;
	border-radius: 5px;
	background: rgba(0, 0, 0, 0.35);
`;

const CraftingResourceList = styled.div`
	float: right;
	width: 150px;
	color: white;
	overflow-y: scroll;
	overflow-x: hidden;
	margin-left: 5px;

	.craftingImg {
		width: 20px;
		height: auto;
		display: inline-block;
		position: relative;
		top: 4px;
	}

	p {
		margin: 0;
		padding: 0;
	}
`;

type IProps = {
	unit: InventoryUnit;
	inventory: types.IInventory;
};

function Inventory({ unit, inventory }: IProps) {
	const context = useGlobalInventoryContext();
	const [isShaking, setIsShaking] = React.useState(false);
	const weightIndicatorWidth = React.useMemo(() => {
		return (inventory.currentWeight / inventory.totalWeight) * 100;
	}, [inventory.currentWeight, inventory.totalWeight]);

	React.useEffect(() => {
		if (isShaking) {
			setTimeout(() => {
				setIsShaking(false);
			}, 2000);
		}
	}, [isShaking]);

	function shakeEffect() {
		setIsShaking(true);
	}

	return (
		<InventoryOuter>
			<InventoryTitle>{inventory.label ?? inventory.type} </InventoryTitle>
			<Loader totalWeight={inventory.totalWeight} weightIndicatorWidth={weightIndicatorWidth} alert={isShaking} />
			<IventoryLeft shaking={isShaking}>
				<InventoryContainer
					className={classNames({
						shake: isShaking,
					})}
				>
					{_.times(
						inventory.type === "crafting" ? Object.keys(inventory.slots).length : inventory.totalSlots,
						(index) => {
							index = index + 1; // to keep correct slot number
							const slotData: types.ISlot = {
								slotNumber: index,
								inventory: inventory.type,
								owner: inventory.owner,
								items: inventory?.slots?.[index]?.items ?? [],
								recipe: inventory?.slots?.[index]?.recipe,
							};

							if (slotData.inventory === "crafting" && !_.isEmpty(slotData.items)) {
								const firstItem = _.first(slotData.items);
								const itemData = context?.itemData?.[firstItem?.name ?? ""];
								const itemsRequired = inventory?.slots?.[index]?.recipe?.itemsRequired ?? itemData?.crafting?.itemsRequired;
								return (
									<CraftingSlotContainer key={index}>
										<Slot
											className="fixed"
											slot={{ ...slotData }}
											inventoryUnit={unit}
											shakeEffect={shakeEffect}
										/>
										<CraftingResourceList>
											{itemsRequired?.map((item) => {
												const craftingItemData = context?.itemData?.[item.itemName];
												return (
													<p key={item.itemName}>
														<img
															className="craftingImg"
															src={craftingItemData?.image ?? ""}
														/>
														{craftingItemData?.label} x {item.amount}
													</p>
												);
											})}
										</CraftingResourceList>
									</CraftingSlotContainer>
								);
							}

							return (
								<Slot
									key={index}
									slot={{ ...slotData }}
									inventoryUnit={unit}
									shakeEffect={shakeEffect}
								/>
							);
						}
					)}
				</InventoryContainer>
			</IventoryLeft>
		</InventoryOuter>
	);
}

export default Inventory;
