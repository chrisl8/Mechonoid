import React, { useEffect, useState } from 'react';
import openSocket from 'socket.io-client';
import { Layout, Row, Col, Button } from 'antd';
import './App.css';
import Servo360 from './components/Servo360';
import Servo from './components/Servo';
import Server360Positions from './components/Server360Positions';

const { Header, Content, Footer } = Layout;

const App = () => {
  const [socket, setSocket] = useState(null);
  const [robotModel, setRobotModel] = useState({
    status: 'Robot Offline',
  });

  useEffect(() => {
    // componentDidMount
    // https://medium.com/@felippenardi/how-to-do-componentdidmount-with-react-hooks-553ba39d1571

    // TODO: Set this from data from the server instead
    document.title = 'Dalek One';

    let newSocket;
    if (window.location.hostname === 'localhost') {
      // For remote control of Dalek1 when running React from laptop
      newSocket = openSocket(`http://192.168.1.56/`);
    } else {
      // Production
      newSocket = openSocket();
    }
    // For local testing on the robot:
    // const newSocket = openSocket(`http://${window.location.hostname}:8080`);

    setSocket(newSocket);

    newSocket.on('disconnect', () => {
      setRobotModel({
        status: 'Robot Offline',
      });
    });

    newSocket.on('robotModel', (data) => {
      setRobotModel(JSON.parse(data));
    });
  }, []);

  const handleLightsButton = () => {
    // TODO: Put this in robot config and set via update from robot web site.
    window.open(`http://192.168.1.31/`, '_blank');
  };

  return (
    <Layout className="layout">
      <Header>
        <span style={{ color: 'rgb(175 38 38 / 85%)', fontSize: '2em' }}>
          Dalek One{' '}
          {robotModel.status === 'Robot Offline' && (
            <span>
              <strong>&nbsp;-&nbsp;OFFLINE!</strong>
            </span>
          )}
        </span>
      </Header>
      {robotModel.status === 'Online' && (
        <Content style={{ margin: '24px 16px 0' }}>
          <div>
            {/* TODO: Add button to home/center all servos. */}
            <Row>
              <Col style={{ margin: 8 }}>
                <Servo name="eyeStalk" socket={socket} />
              </Col>
              <Col style={{ margin: 8 }}>
                <Servo360 name="head" socket={socket} />
                <Server360Positions
                  socket={socket}
                  servoGroup="shoulders"
                  locations={robotModel.servos.head.switchClosed}
                />
              </Col>
              <Col style={{ margin: 8 }}>
                {/* TODO: Add button indicators of Left/Right/Center positions. */}
                {/* TODO: Add indicators of being in between button places. */}
                <Servo360 name="shoulders" socket={socket} />
                <Server360Positions
                  socket={socket}
                  servoGroup="shoulders"
                  locations={robotModel.servos.shoulders.switchClosed}
                />
              </Col>
            </Row>
            <Row>
              <Col style={{ margin: 8 }}>
                <Button onClick={handleLightsButton}>Lights</Button>
              </Col>
            </Row>
            <Row>
              <Col style={{ margin: 8 }}>
                <hr />
                <p>
                  Servo 360 sliders control speed and snap to 0 (stopped) when
                  you let go.
                  <br />
                  Servo sliders control absolute position of the servo and stay
                  put when released.
                </p>
              </Col>
            </Row>
          </div>
        </Content>
      )}
      <Footer style={{ textAlign: 'center' }}>Robot Anything</Footer>
    </Layout>
  );
};
export default App;
