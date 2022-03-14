import React from "react";
import * as types from "@shared/types";
import styled from "styled-components";
import useGlobalInventoryContext from "../core/GlobalInventoryContext";
import useCoreContext from "../core/context/CoreContext";

const Container = styled.div`
	width: 270px;
	height: 400px;
	background: rgb(53, 70, 86);
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	margin-top: 28px;
	border-radius: 20px;
	z-index: 999;
	box-shadow: 0px 10px 13px -7px #000000, 5px 5px 15px 5px rgb(0 0 0 / 0%);
`;

const GiveButton = styled.button`
	width: 90%;
	height: 45px;
	background: rgba(26, 29, 37, 0.77);
	border-radius: 12px;
	color: white;
	border: none;
	position: flex;
	margin: 5%;
	margin-top: 0px;

	&:hover {
		background: linear-gradient(13deg, #c7ceff 14%, #f9d4ff 64%);
		color: black;
	}
`;

const Inner = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
`;

const CancelButton = styled.button`
	position: absolute;
	width: 90%;
	height: 45px;
	background: darkred;
	border-radius: 12px;
	color: white;
	border: none;
	margin: 5%;
	bottom: 10px;
	left: 0px;

	&:hover {
		background: linear-gradient(13deg, #c7ceff 14%, #f9d4ff 64%);
		color: black;
	}
`;

const TopText = styled.h3`
	text-align: center;
	color: white;
`;

function GiveMenu() {
	const context = useGlobalInventoryContext();
	const coreContext = useCoreContext();

	if (!coreContext.visibility || !context?.giveMenuProps || !context?.giveMenuProps?.slot) return <React.Fragment />;
	return (
		<Container>
			<Inner>
				<TopText>Velg personen du vil gi til</TopText>
				{context?.giveMenuProps?.players?.map?.((player) => (
					<GiveButton
						key={player.serverId}
						onClick={() => {
							context?.giveMenuProps?.slot &&
								context?.giveItem?.(player.serverId, context.giveMenuProps.slot);
						}}
					>
						{player.charName} ({player.serverId})
					</GiveButton>
				))}
				<CancelButton
					onClick={() => {
						context?.clearGiveMenu?.();
					}}
				>
					Avbryt
				</CancelButton>
			</Inner>
		</Container>
	);
}

export default GiveMenu;
