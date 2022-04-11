import React from 'react';
import { Col, Row } from 'antd';

const ConfigFileError = (props) => (
  <Row>
    <Col style={{ margin: 8 }}>
      <p>{props.robotModel.error}</p>
      {props.robotModel.errorMessage && (
        <p>
          Error message:
          <br />
          {props.robotModel.errorMessage}
        </p>
      )}
    </Col>
  </Row>
);

export default ConfigFileError;
