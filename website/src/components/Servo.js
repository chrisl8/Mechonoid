import React, { useState } from 'react';
import { Card, Slider } from 'antd';

const Servo = (props) => {
  const [disabled] = useState(false);
  const [setting, setSetting] = useState(0);

  const handleSliderChange = (value) => {
    setSetting(value);
    if (props.socket) {
      props.socket.emit('servo', { target: props.name, value });
    }
  };

  // TODO: Update current setting to spot on slider from server,
  //       so that if user A move it, user B an see that it has moved.

  return (
    <Card
      size="small"
      title="Servo"
      extra={props.name.charAt(0).toUpperCase() + props.name.slice(1)}
      style={{ width: 300 }}
    >
      <Slider
        included={false}
        value={setting}
        disabled={disabled}
        min={-1000}
        max={1000}
        onChange={handleSliderChange}
      />
    </Card>
  );
};

export default Servo;
