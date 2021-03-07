import React from 'react';
import { Row, Col, Button } from 'antd';

const Servo = (props) => {
  const handlePositionButtons = (event) => {
    props.socket.emit('sendServoToLocation', {
      target: props.servoGroup,
      value: event.target.innerText.toLowerCase(),
    });
  };

  const buttons = [];
  for (const [key] of Object.entries(props.locations)) {
    buttons.push(
      <Col key={key}>
        <Button
          type={props.locations[key] ? 'primary' : ''}
          onClick={handlePositionButtons}
        >
          <span style={{ textTransform: 'capitalize' }}>{key}</span>
        </Button>
      </Col>,
    );
  }

  return (
    <Row justify="space-between">
      {/* TODO: Button Colors: */}
      {/* Green: Entry is HERE. Should it be un-clickable? */}
      {/* Red: Moving TO here. */}
      {/* Hollow: Can be selected as a new place to go. */}
      {/* Arrow pointing from center to Left or Right when left/right of center, but not at any specific one of the 3 */}
      {/* No arrows and everything Blue on startup if no swiches are closed */}
      {buttons}
    </Row>
  );
};

export default Servo;
