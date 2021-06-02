import React from 'react';
import { Row } from 'antd';
import Servo360s from './Servo360s';
import Servos from './Servos';

const ServoController = (props) => (
  <>
    {props.maestroReady ? (
      <>
        <Row>
          <Servo360s socket={props.socket} servos={props.servos} />
        </Row>
        <Row>
          <Servos socket={props.socket} servos={props.servos} />
        </Row>
      </>
    ) : (
      <Row>Servo Controller not Ready yet...</Row>
    )}
  </>
);

export default ServoController;
