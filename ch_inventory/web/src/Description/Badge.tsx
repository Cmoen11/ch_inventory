import React from "react";
import styled from "styled-components";

const PoliceCardContainer = styled.div`
  position: relative;
  width: 423px;
  height: 334px;
  overflow: hidden;
`;

const PoliceCardImg = styled.img`
  position: relative;
  z-index: 22;
  width: 423px;
  height: 334px;
`;

const PoliceAvatar = styled.img`
  position: absolute;
  z-index: -9;
  left: 10px;
  height: 170px;
  width: auto;
  bottom: 70px;
`;

const CallSign = styled.span`
  position: absolute;
  font-size: 20px;
  z-index: 999;
  bottom: 67px;
  left: 85px;
  font-family: "Arial Black", "Arial Bold";
  color: #f2ec4c;
  text-transform: uppercase;
`;

const CardInformation = styled.div`
  font-family: Arial;
  position: absolute;
  text-transform: uppercase;
  width: 160px;
  height: 200px;
  z-index: 999;
  top: 70px;
  right: 30px;
  text-align: left;
  font-size: 14px;
`;



export default function PoliceCard(props: {
  name: string;
  jobRank: string;
  department: string;
  expirationDate: string;
  callsign: string;
  avatarSrc: string;
}) {
  return (
    <PoliceCardContainer>
      <PoliceCardImg src={"https://i.imgur.com/Qc19ArE.png"} />
      <CallSign>{props.callsign}</CallSign>
      <CardInformation className="findme">
        <strong>Navn</strong> <br />
        {props.name} <br /> <br />
        <strong>Stilling</strong>
        <br />
        {props.jobRank}
        <br /> <br />
        <strong>Avdeling</strong>
        <br />
        {props.department}
        <br /> <br />
        <strong>Utløpsdato</strong>
        <br />
        {props.expirationDate}
      </CardInformation>
      <PoliceAvatar src={props.avatarSrc} />
    </PoliceCardContainer>
  );
}
