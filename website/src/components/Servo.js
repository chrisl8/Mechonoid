import React, { useState } from 'react';
import { Card, Slider } from 'antd';
import fancyName from '../utils/FancyName';

const Servo = (props) => {
  const [disabled] = useState(false);
  const [setting, setSetting] = useState(0);

  const handleSliderChange = (value) => {
    setSetting(value);
    if (props.socket) {
      props.socket.emit('servo', { target: props.name, value });
    }
  };

  let sliderStyle = { width: 300 };
  if (props.vertical) {
    sliderStyle = { height: 300 };
  }

  // TODO: Update current setting to spot on slider from server,
  //       so that if user A move it, user B an see that it has moved.

  return (
    <Card size="small" title="Servo" extra={fancyName(props.name)}>
      <div style={sliderStyle}>
        <Slider
          included={false}
          value={setting}
          disabled={disabled}
          min={-1000}
          max={1000}
          onChange={handleSliderChange}
          vertical={props.vertical}
        />
      </div>
    </Card>
  );
};

export default Servo;
