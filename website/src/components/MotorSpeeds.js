import React from 'react';
import { Col } from 'antd';
import MotorSpeed from './MotorSpeed';

const MotorSpeeds = (props) => {
  const motors = [];
  if (props.motors) {
    for (const [key, values] of Object.entries(props.motors)) {
      if (values.type === 'speed') {
        motors.push(
          <Col key={key} style={{ margin: 8 }}>
            <MotorSpeed name={key} socket={props.socket} />
          </Col>,
        );
      }
    }
  }

  return motors;
};

export default MotorSpeeds;
