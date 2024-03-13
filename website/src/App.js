import React, { useEffect, useState } from 'react';
import openSocket from 'socket.io-client';
import { Layout, Row, Col, Button } from 'antd';
import { isEmpty } from 'lodash';
import Headers from './components/Headers';
import ApiDocumentation from './components/ApiDocumentation';
import OsCommands from './components/OsCommands';
import ServoController from './components/ServoController';
import MotorController from './components/MotorController';
import HardwareControllerStats from './components/hardwareControllerStats';
import EditConfigFile from './components/EditConfigFile';
import ConfigFileError from './components/ConfigFileError';

const { Header, Content, Footer } = Layout;

const App = () => {
  const [socket, setSocket] = useState(null);
  const [robotModel, setRobotModel] = useState({
    status: 'Offline',
    robotName: 'Mechonoid',
  });
  const [showApi, setShowApi] = useState(false);
  const [showOsCommands, setShowOsCommands] = useState(false);
  const [showEditConfigFile, setShowEditConfigFile] = useState(false);

  useEffect(() => {
    // componentDidMount
    // https://medium.com/@felippenardi/how-to-do-componentdidmount-with-react-hooks-553ba39d1571

    const newSocket = openSocket({
      transports: ['websocket'],
    });
    // For local testing on the robot:
    // const newSocket = openSocket(`http://${window.location.hostname}:8080`);
    // For testing testing on my laptop with remote robot:
    // const newSocket = openSocket(`http://192.168.1.122`, {
    //   transports: ['websocket'],
    // });

    setSocket(newSocket);

    newSocket.on('disconnect', () => {
      setRobotModel({
        status: 'Offline',
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

  const handleOsCommandsButton = () => {
    setShowOsCommands(!showOsCommands);
  };

  const handleEditConfigFileButton = () => {
    setShowEditConfigFile(!showEditConfigFile);
  };

  const handleRebootButton = () => {
    if (socket) {
      socket.emit('reboot');
    }
  };

  const handleShutdownButton = () => {
    if (socket) {
      socket.emit('shutdown');
    }
  };

  const handleRestartServerButton = () => {
    if (socket) {
      socket.emit('restartServer');
    }
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
    } else if (showOsCommands) {
      pageContent = (
        <OsCommands
          handleRebootButton={handleRebootButton}
          handleShutdownButton={handleShutdownButton}
          handleOsCommandsButton={handleOsCommandsButton}
          handleRestartServerButton={handleRestartServerButton}
        />
      );
    } else if (showEditConfigFile) {
      pageContent = (
        <EditConfigFile
          robotModel={robotModel}
          handleEditConfigFileButton={handleEditConfigFileButton}
          handleRestartServerButton={handleRestartServerButton}
        />
      );
    } else {
      // TODO: Add button to home/center all servos.
      pageContent = (
        <>
          {robotModel.error && (
            <>
              <ConfigFileError robotModel={robotModel} />
              <Row>
                <Col style={{ margin: 8 }}>
                  <Button onClick={handleRestartServerButton}>
                    Restart Server
                  </Button>
                </Col>
                <Col style={{ margin: 8 }}>
                  <Button onClick={handleEditConfigFileButton}>
                    Edit Config File
                  </Button>
                </Col>
              </Row>
            </>
          )}
          {robotModel.hardware &&
            robotModel.motors &&
            Object.keys(robotModel.motors).length > 0 && (
              <MotorController
                socket={socket}
                motors={robotModel.motors}
                hardware={robotModel.hardware}
              />
            )}
          {robotModel.hardware &&
            robotModel.servos &&
            Object.keys(robotModel.servos).length > 0 && (
              <ServoController
                socket={socket}
                servos={robotModel.servos}
                hardware={robotModel.hardware}
              />
            )}
          {Boolean(robotModel.hardware && !isEmpty(robotModel.hardware)) && (
            <Row>
              <Col style={{ margin: 8 }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  Controllers
                </div>
                <HardwareControllerStats hardware={robotModel.hardware} />
              </Col>
            </Row>
          )}
          {Boolean(robotModel.hasLEDs) && (
            <Row>
              <Col style={{ margin: 8 }}>
                <Button onClick={handleLightsButton}>Lights</Button>
              </Col>
            </Row>
          )}
          <Row>
            <Col style={{ width: '100%' }}>
              <hr />
            </Col>
          </Row>
          {robotModel.hardware &&
            robotModel.servos &&
            Object.keys(robotModel.servos).length > 0 && (
              <Row>
                <Col style={{ margin: 8 }}>
                  <p>
                    Servo 360 sliders control speed and snap to 0 (stopped) when
                    you let go.
                    <br />
                    Servo sliders control absolute position of the servo and
                    stay put when released.
                  </p>
                </Col>
              </Row>
            )}
          <Row>
            <Col style={{ margin: 8 }}>
              <Button onClick={handleApiDocumentationButton}>
                API Documentation
              </Button>
            </Col>
            <Col style={{ margin: 8 }}>
              <Button onClick={handleOsCommandsButton}>OS Commands</Button>
            </Col>
            <Col style={{ margin: 8 }}>
              <Button onClick={handleEditConfigFileButton}>
                Edit Config File
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
            {robotModel.status === 'Offline' && (
              <span>
                <strong>The Robot is OFFLINE!</strong>
              </span>
            )}
            {robotModel.error && (
              <span>
                <strong>Config File Error!</strong>
              </span>
            )}
          </span>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>{pageContent}</Content>
        <Footer style={{ textAlign: 'center' }}>
          <a href="https://github.com/chrisl8/Mechonoid">Mechonoid</a>
        </Footer>
      </Layout>
    </>
  );
};

export default App;
