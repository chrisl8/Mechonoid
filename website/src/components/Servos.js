import React from 'react';
import { Col } from 'antd';
import Servo from './Servo';

const Servos = (props) => {
  const servos = [];
  if (props.servos) {
    for (const [key, values] of Object.entries(props.servos)) {
      if (values.type === 180) {
        servos.push(
          <Col key={key} style={{ margin: 8 }}>
            <Servo name={key} socket={props.socket} />
          </Col>,
        );
      }
    }
  }

  return servos;
};

export default Servos;
