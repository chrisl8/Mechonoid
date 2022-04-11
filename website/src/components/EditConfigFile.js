import React, { useEffect, useState } from 'react';
import { Button, Col, Row } from 'antd';

import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

import ConfigFileError from './ConfigFileError';

const EditConfigFile = (props) => {
  const [configFile, setConfigFile] = useState(null);
  const [errorLoadingConfigFile, setErrorLoadingConfigFile] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [saveErrorText, setSaveErrorText] = useState(null);

  const loadConfigFile = () => {
    fetch('http://192.168.1.122/rawConfigFile', {}).then((response) => {
      if (response.status === 200) {
        response.text().then((text) => {
          setConfigFile(text);
        });
      } else {
        setErrorLoadingConfigFile(true);
      }
    });
  };

  useEffect(() => {
    loadConfigFile();
  }, []);

  const onEdit = (newValue) => {
    setConfigFile(newValue);
  };

  const onSave = () => {
    setSaveInProgress(true);
    fetch('http://192.168.1.122/updateConfigFile', {
      method: 'post',
      body: JSON.stringify({ text: configFile }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        setSaveInProgress(false);
        if (response.status === 200) {
          setSaveErrorText(null);
          setConfigFile(null);
          loadConfigFile();
        } else {
          response.text().then((text) => {
            setSaveErrorText(text);
          });
        }
      })
      .catch((error) => {
        setSaveInProgress(false);
        error.text().then((text) => {
          setSaveErrorText(text);
        });
      });
  };

  return (
    <>
      <h1>Edit and Update the Config File here</h1>
      {props.robotModel.error && (
        <ConfigFileError robotModel={props.robotModel} />
      )}
      {errorLoadingConfigFile && (
        <div>
          <h2>Error Loading Config File</h2>
          <p>
            There was an error loading the config file. Please check the
            connection to the Mechonoid and try again.
          </p>
        </div>
      )}
      {Boolean(saveErrorText) && (
        <div>
          <h2>Error Saving Config File</h2>
          <p>{saveErrorText}</p>
        </div>
      )}
      {Boolean(configFile && !errorLoadingConfigFile) && (
        <Row>
          <Col style={{ margin: 8, width: '100%' }}>
            <AceEditor
              mode="javascript"
              theme="monokai"
              name="configFile"
              width="100%"
              value={configFile}
              onChange={onEdit}
              setOptions={{
                useWorker: false,
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showLineNumbers: true,
                tabSize: 2,
              }}
            />
          </Col>
        </Row>
      )}
      <Row>
        <Col style={{ margin: 8 }}>
          <p>
            You must Restart the Server for config file changes to take effect.
          </p>
        </Col>
      </Row>
      <Row>
        {Boolean(configFile && !errorLoadingConfigFile) && (
          <Col style={{ margin: 8 }}>
            <Button
              type="primary"
              onClick={onSave}
              disabled={saveInProgress}
              loading={saveInProgress}
            >
              Save
            </Button>
          </Col>
        )}
        <Col style={{ margin: 8 }}>
          <Button onClick={props.handleRestartServerButton}>
            Restart Server
          </Button>
        </Col>
        <Col>
          <Button
            style={{ marginTop: 8 }}
            onClick={props.handleEditConfigFileButton}
          >
            Close
          </Button>
        </Col>
      </Row>
    </>
  );
};

export default EditConfigFile;
