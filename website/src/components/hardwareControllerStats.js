import React from 'react';
import { Card } from 'antd';
import fancyName from '../utils/FancyName';

const HardwareControllerStats = (props) => {
  const hardwareControllerStats = [];
  if (props.hardware) {
    for (const [controller, entries] of Object.entries(props.hardware)) {
      const controllerEntries = [];
      for (const [key, value] of Object.entries(entries)) {
        controllerEntries.push(
          <span key={key}>
            {fancyName(key)}: {String(value)}
            <br />
          </span>,
        );
        // if (values.type === 180) {
        //   servos.push(
        //     <Col key={key} style={{ margin: 8 }}>
        //       <Servo
        //         name={key}
        //         socket={props.socket}
        //         vertical={values.vertical}
        //       />
        //     </Col>,
        //   );
        // }
      }
      hardwareControllerStats.push(
        <Card size="small" title={fancyName(controller)} key={controller}>
          <div>{controllerEntries}</div>
        </Card>,
      );
    }
  }

  return hardwareControllerStats;
};

export default HardwareControllerStats;
