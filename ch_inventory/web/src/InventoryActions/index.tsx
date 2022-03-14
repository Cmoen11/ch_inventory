import React from "react";
import styled from "styled-components";
import { GiHand, GiMoneyStack } from "react-icons/gi";
import useGlobalInventoryContext from "core/GlobalInventoryContext";
import { numberformatter } from "utils";

const InventoryActionsContainer = styled.div`
	width: 200px;
	border-radius: 10px;
	height: 300px;
	background: rgba(0, 0, 0, 0.5);
	align-self: center;
	display: flex;
	justify-content: center;
	flex-flow: row-reverse wrap;
`;

const InputAmount = styled.input`
	width: 178px;
	height: 45px;
	background: rgba(26, 29, 37, 0.77);
	border-radius: 12px;
	color: white;
	border: none;
	margin-top: 10px;
	text-align: center;
`;

const GiveDiv = styled.div`
	position: relative;
	top: 15px;
	display: block;
	width: 178px;
	color: white;
	text-align: center;
	font-size: 50px;
	span {
		font-size: 40px;
		position: relative;
		top: -30px;
		font-family: Acme;
	}
`;

const CloseButton = styled.button`
	width: 178px;
	height: 45px;
	background: rgba(26, 29, 37, 0.77);
	border-radius: 12px;
	color: white;
	border: none;

	&:hover {
		background: linear-gradient(13deg, #c7ceff 14%, #f9d4ff 64%);
		color: black;
	}
`;

const DropZone = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 90%;
	z-index: 9999;
`;

const BalanceIndicator = styled.div`
	color: white;
	text-align: center;
	font-size: 16px;
`;

function InventoryActions() {
	const inventoryContext = useGlobalInventoryContext();

	function onMouseUpUse() {
		if (inventoryContext?.hoverSlot) {
			inventoryContext?.useItem?.(inventoryContext?.hoverSlot.slot);
		}
	}


	// Hot fix med crafting inventory feil
	React.useEffect(() => {
		if (inventoryContext?.secoundInventory?.type === "crafting") {
			inventoryContext?.setMoveAmount?.("");
		}
	}, [inventoryContext, inventoryContext?.secoundInventory]);

	return (
		<InventoryActionsContainer>
			<InputAmount
				type="number"
				min={0}
				value={inventoryContext?.moveAmount ?? ""}
				onChange={(e) => inventoryContext?.setMoveAmount?.(parseInt(e.target.value))}
				onClick={() => inventoryContext?.setMoveAmount?.("")}
				placeholder="Antall"
				disabled={inventoryContext?.secoundInventory?.type === "crafting" }
			/>
			<GiveDiv>
				<DropZone onMouseUp={onMouseUpUse} />
				<GiHand /> <br />
				<span>BRUK</span>
			</GiveDiv>
			<BalanceIndicator>
				<span style={{ color: "green" }}>
					<GiMoneyStack />{" "}
				</span>
				{numberformatter.format(inventoryContext?.balance ?? 0)}
			</BalanceIndicator>
			<CloseButton onClick={() => inventoryContext?.closeInventory?.()}>Lukk</CloseButton>
		</InventoryActionsContainer>
	);
}

export default InventoryActions;
