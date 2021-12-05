import React from 'react';
import { Col } from 'antd';
import MotorSpeed from './MotorSpeed';
import JoystickControl from './JoystickControl';

const Motors = (props) => {
  const motors = [];
  if (props.motors) {
    for (const [key, values] of Object.entries(props.motors)) {
      if (values.type === 'speed') {
        motors.push(
          <Col key={key} style={{ margin: 8 }}>
            <MotorSpeed
              name={key}
              socket={props.socket}
              channel={values.channel}
            />
          </Col>,
        );
      }
      if (values.type === 'differentialSpeed') {
        motors.push(
          <Col key={key} style={{ margin: 8 }}>
            <JoystickControl
              name={key}
              socket={props.socket}
              channel={values.channel}
            />
          </Col>,
        );
      }
    }
  }

  return motors;
};

export default Motors;
