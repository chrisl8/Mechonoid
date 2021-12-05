import React from 'react';
import { Row } from 'antd';
import Motors from './Motors';

const MotorController = (props) => {
  let controllerReady = null;
  for (const [, value] of Object.entries(props.motors)) {
    if (controllerReady !== false) {
      controllerReady = props.hardware[value.hardwareController];
    }
  }

  return controllerReady ? (
    <Row>
      <Motors socket={props.socket} motors={props.motors} />
    </Row>
  ) : (
    <Row>Motor Controller not Ready yet...</Row>
  );
};

export default MotorController;
