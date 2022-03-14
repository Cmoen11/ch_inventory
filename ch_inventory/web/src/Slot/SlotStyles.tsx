import styled, { css } from "styled-components";

export const SlotFrame = styled.div`
	position: relative;
	width: 113px;
	height: 137px;
	background: rgba(0, 0, 0, 0.35);
	border: 1px solid #1a1d25;
	box-sizing: border-box;
	border-radius: 12px;
	display: flex;
	flex-wrap: nowrap;
	margin-bottom: 2px;
	user-select: none;
	overflow: hidden;

	&:hover {
		background: rgba(0, 0, 0, 0.55);
	}
`;

export const InvisibleSlotFrame = styled.div`
	position: absolute;
	z-index: 9999;
	width: 100%;
	height: 100%;
`;

export const SlotFooter = styled.div`
	position: absolute;
	width: 113px;
	height: 26px;
	bottom: 0;
	background: #1a1d25;
	border-radius: 0px 0px 12px 12px;
	text-align: center;
	font-family: Acme;
	font-size: 10px;
	font-style: normal;
	font-weight: 400;
	line-height: 13px;
	letter-spacing: 0em;
	text-align: center;
	color: white;
	overflow: hidden;
`;

export const SlotFooterSpan = styled.span`
	position: relative;
	top: 1px;
`;

export const SlotImage: any = styled.img`
    object-fit: cover;
    width: 113px;
    height: 108px;
    position: absolute;
	top: 5px;
	${(props: any) => props.isExpired && `filter: grayscale(100%);`}
`;

export const SlotNumber = styled.span`
	color: white;
	padding: 1px 0 0 5px;
`;

export const SlotUseText = styled.span`
	color: black;
	background: white;
	padding: 1px 0 0 5px;
	height: 20px;
	padding-right: 4px;
	font-size: 12px;
	font-weight: bold;
	border-radius: 5px;
`;

export const CountAndWeight = styled.span`
	position: absolute;
	bottom: 30px;
	font-size: 11px;
	right: 2px;
	color: white;
`;

export const DurabilityBar = styled.div`
	position: absolute;
	height: 10px;
	bottom: 0;
`;
// border-radius: 0px 0px 12px 12px;

export const ItemInformationBox = styled.div`
	postion: relative;
	top: 0px;
	width: 300px;
	padding: 10px;
	padding-top: 0px;
	padding-bottom: 30px;
	border-radius: 10px;
	min-height: 100px;
	background: rgba(50, 72, 90, 0.9);
	color: white;
	font-size: 11px;

	.info {
		position: absolute;
		bottom: 5px;
		text-align: center;
	}
`;

export const PriceSpan = styled.span`
	display: block;
	font-weight: 15px;
	font-size: 15px;
	color: darkgreen;
`;
