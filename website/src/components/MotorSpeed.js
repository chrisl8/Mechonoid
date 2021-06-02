import React, { useState } from 'react';
import { Card, Slider } from 'antd';

const MotorSpeed = (props) => {
  const [disabled] = useState(false);
  const [setting, setSetting] = useState(0);

  const handleSliderChange = (value) => {
    setSetting(value);
    if (props.socket) {
      props.socket.emit('motorSpeed', { target: props.name, value });
    }
  };

  const handleSliderAfterChange = () => {
    setSetting(0);
    if (props.socket) {
      props.socket.emit('motorSpeed', { target: props.name, value: 0 });
    }
  };

  return (
    <Card
      size="small"
      title="Dual Motors"
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
        onAfterChange={handleSliderAfterChange}
        marks={{ 0: '' }}
      />
    </Card>
  );
};

export default MotorSpeed;
