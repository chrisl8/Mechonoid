import React from 'react';
import { Col } from 'antd';
import Servo360 from './Servo360';
import Server360Positions from './Server360Positions';

const Servo360s = (props) => {
  const servos = [];
  if (props.servos) {
    for (const [key, values] of Object.entries(props.servos)) {
      if (values.type === 360) {
        servos.push(
          <Col key={key} style={{ margin: 8 }}>
            <Servo360 name={key} socket={props.socket} />
            <Server360Positions
              socket={props.socket}
              servoGroup={key}
              locations={values.switchClosed}
            />
          </Col>,
        );
      }
    }
  }

  return servos;
};

export default Servo360s;
