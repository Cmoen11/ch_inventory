import React from "react";
import styled from "styled-components";

const Container = styled.div`
	position: relative;
	width: 480px;
	height: 300px;
	overflow: hidden;
`;

const LicenseFrame = styled.div`
	position: absolute;
	background: url("https://i.imgur.com/N2QK06x.png") no-repeat;
	background-size: 450px auto;
	width: 480px;
	height: 300px;
	z-index: 2;
`;

const Image = styled.img`
	position: absolute;
	z-index: 1;
	width: 140px;
	height: auto;
	top: 80px;
	left: 20px;
`;

const ImageSmal = styled.img`
	position: absolute;
	width: 60px;
	height: auto;
	z-index: -1;
	right: 70px;
	bottom: 90px;
	filter: grayscale(100%);
`;

const MainDescription = styled.div`
	position: absolute;
	width: 250px;
	height: 130px;
	left: 150px;
	bottom: 85px;
	color: black;
	font-size: 13px;
	z-index: 5;
`;

const Signature = styled.span`
	font-size: 30px;
	font-family: "Reenie Beanie", cursive;
`;

function License(props: any) {
	return (
		<Container>
			<LicenseFrame />

			<Image src={props.image} />
			<ImageSmal src={props.image} />
			<MainDescription>
				<table>
					<tr>
						<td>Navn:</td>
						<td>{props.name}</td>
					</tr>
					<tr>
						<td>Utskrevet:</td>
						<td>{props.createdDate?.split?.(" ")?.[0]}</td>
					</tr>
					<tr>
						<td>Utløper:</td>
						<td>{props.dueDate?.split?.(" ")?.[0]}</td>
					</tr>
					<tr>
						<td>Grupper:</td>
						<td>{JSON.parse(props.licenses).join(" ")}</td>
					</tr>
					<tr>
						<td>Id</td>
						<td>{props.id}</td>
					</tr>
				</table>
				<Signature>{props.name}</Signature>
			</MainDescription>
		</Container>
	);
}

export default License;
