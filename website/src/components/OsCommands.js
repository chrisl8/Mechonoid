import React from 'react';
import { Button, Col, Row } from 'antd';

const OsCommands = (props) => (
  <>
    <h1>Commands to the Linux OS under on the Robot.</h1>
    <Row>
      <Col style={{ margin: 8 }}>
        <Button onClick={props.handleRebootButton}>Reboot</Button>
      </Col>
      <Col style={{ margin: 8 }}>
        <Button onClick={props.handleShutdownButton}>Shutdown</Button>
      </Col>
    </Row>
    <Row>
      <Col>
        <Button
          style={{ marginTop: 25 }}
          onClick={props.handleOsCommandsButton}
        >
          Close
        </Button>
      </Col>
    </Row>
  </>
);
export default OsCommands;
