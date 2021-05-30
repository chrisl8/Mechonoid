import React, { useEffect, useState } from 'react';
import openSocket from 'socket.io-client';
import { Layout, Row, Col, Button } from 'antd';
import './App.css';
import Headers from './components/Headers';
import Servos from './components/Servos';
import Servo360s from './components/Servo360s';
import ApiDocumentation from './components/ApiDocumentation';

const { Header, Content, Footer } = Layout;

const App = () => {
  const [socket, setSocket] = useState(null);
  const [robotModel, setRobotModel] = useState({
    status: 'Robot Offline',
    robotName: 'Robot Anything',
  });
  const [showApi, setShowApi] = useState(false);

  useEffect(() => {
    // componentDidMount
    // https://medium.com/@felippenardi/how-to-do-componentdidmount-with-react-hooks-553ba39d1571

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

  const handleApiDocumentationButton = () => {
    setShowApi(!showApi);
  };

  let pageContent;

  if (robotModel.status === 'Online') {
    if (showApi) {
      pageContent = (
        <ApiDocumentation
          handleApiDocumentationButton={handleApiDocumentationButton}
          robotModel={robotModel}
        />
      );
    } else {
      // TODO: Add button to home/center all servos.
      pageContent = (
        <>
          <Row>
            <Servo360s socket={socket} servos={robotModel.servos} />
          </Row>
          <Row>
            <Servos socket={socket} servos={robotModel.servos} />
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
                Servo 360 sliders control speed and snap to 0 (stopped) when you
                let go.
                <br />
                Servo sliders control absolute position of the servo and stay
                put when released.
              </p>
              <Button onClick={handleApiDocumentationButton}>
                API Documentation
              </Button>
            </Col>
          </Row>
        </>
      );
    }
  }

  return (
    <>
      <Headers title={robotModel.robotName} />
      <Layout className="layout">
        <Header>
          <span style={{ color: 'rgb(175 38 38 / 85%)', fontSize: '2em' }}>
            {robotModel.robotName}
            {robotModel.status === 'Robot Offline' && (
              <span>
                <strong>The Robot is OFFLINE!</strong>
              </span>
            )}
          </span>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>{pageContent}</Content>
        <Footer style={{ textAlign: 'center' }}>Robot Anything</Footer>
      </Layout>
    </>
  );
};
export default App;
