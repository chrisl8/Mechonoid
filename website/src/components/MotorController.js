import React from 'react';
import { Row } from 'antd';
import MotorSpeeds from './MotorSpeeds';

const MotorController = (props) => (
  <>
    {props.roboClawReady ? (
      <Row>
        <MotorSpeeds socket={props.socket} motors={props.motors} />
      </Row>
    ) : (
      <Row>Motor Controller not Ready yet...</Row>
    )}
  </>
);

export default MotorController;
