import React, { useState } from 'react';
import { Card, Slider } from 'antd';
import fancyName from '../utils/FancyName';

const Servo360 = (props) => {
  const [disabled] = useState(false);
  const [setting, setSetting] = useState(0);

  const handleSliderChange = (value) => {
    setSetting(value);
    if (props.socket) {
      props.socket.emit('servo360', { target: props.name, value });
    }
  };

  const handleSliderAfterChange = () => {
    setSetting(0);
    if (props.socket) {
      props.socket.emit('servo360', { target: props.name, value: 0 });
    }
  };

  return (
    <Card
      size="small"
      title="Servo 360"
      extra={fancyName(props.name)}
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

export default Servo360;
