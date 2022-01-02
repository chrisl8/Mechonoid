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

  const handleSliderAfterChange = () => {
    // A 0 to a regular servo just means "turn off". The servo will stay at the
    // last position if it isn't under strain.
    // This prevents the servo from drawing current continuously.
    // We are NOT setting the slider position to 0, because, again 0 turns
    // the servo off, it does not move it.
    if (props.socket) {
      props.socket.emit('servo360', { target: props.name, value: 0 });
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
          onAfterChange={handleSliderAfterChange}
          vertical={props.vertical}
        />
      </div>
    </Card>
  );
};

export default Servo;
