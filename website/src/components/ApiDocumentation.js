import React from 'react';
import { Button } from 'antd';

const ApiDocumentation = (props) => {
  const pageURL = window.location.origin;
  const switchedLocationTargetsAndValues = [];
  const servo360s = [];
  const servos = [];
  if (
    typeof props.robotModel.servos === 'object' &&
    props.robotModel.servos !== null
  ) {
    for (const [group, values] of Object.entries(props.robotModel.servos)) {
      if (
        values.type === 360 &&
        typeof values.switchClosed &&
        values.switchClosed !== undefined
      ) {
        const thisGroup = [];
        for (const [location] of Object.entries(values.switchClosed)) {
          thisGroup.push(
            <ul key={`${group}-${location}`}>
              <li>
                Move Robot {group} to {location}:&nbsp;
                <a
                  href={`${pageURL}/sendServoToLocation/${group}/${location}`}
                  target="_blank"
                  rel="noreferrer"
                >{`${pageURL}/sendServoToLocation/${group}/${location}`}</a>
              </li>
            </ul>,
          );
        }
        switchedLocationTargetsAndValues.push(
          <span key={group}>
            <h3 style={{ textTransform: 'capitalize' }}>{group}</h3>
            {thisGroup}
          </span>,
        );
      }

      if (values.type === 360) {
        servo360s.push(
          <li key={group}>
            <span style={{ textTransform: 'capitalize' }}>{group}</span>:&nbsp;
            <a
              href={`${pageURL}/servo360/${group}/0`}
              target="_blank"
              rel="noreferrer"
            >{`${pageURL}/servo360/${group}/0`}</a>
          </li>,
        );
      }

      if (values.type === 180) {
        servos.push(
          <li key={group}>
            <span style={{ textTransform: 'capitalize' }}>{group}</span>:&nbsp;
            <a
              href={`${pageURL}/servo/${group}/0`}
              target="_blank"
              rel="noreferrer"
            >{`${pageURL}/servo/${group}/0`}</a>
          </li>,
        );
      }
    }
  }

  return (
    <>
      <h1>These are the direct HTTP GET requests that you can send</h1>
      <h2>Robot Information and Status</h2>
      <ul>
        <li>
          <a
            href={`${pageURL}/model`}
            target="_blank"
            rel="noreferrer"
          >{`${pageURL}/model`}</a>
        </li>
      </ul>
      <p>
        This will return a JSON object containing all information about the
        robot and the current status of all parts.
        <br />
        Note that the commands below will always return 200 (OK) to acknowledge
        receipt of your command. They will NOT return status of the robot.
        <br />
        It is up to you to use the above URL to obtain the status of the robot
        if you want to know the result of your input below.
      </p>
      {switchedLocationTargetsAndValues.length > 0 && (
        <>
          <h2>Send Robot Part to Switch controlled Location</h2>
          <ul>{switchedLocationTargetsAndValues}</ul>
        </>
      )}
      {servo360s.length > 0 && (
        <div style={{ marginTop: 25 }}>
          <h2>Start a 360 degree servo moving</h2>
          <p>
            The range is -1000 to 1000.
            <br />
            Negative is &quot;reverse&quot;, positive is &quot;forward&quot;, 0
            is stopped.
            <br />
            The code on the robot will translate these ranges to the maximum and
            minimum speed and stop set point of the servo.
            <br />
            The example is set to 0, because stopping the servo is the safest
            option.
            <br />
            Remember to stop them when you are done. ;)
          </p>
          {servo360s}
        </div>
      )}
      {servos.length > 0 && (
        <div style={{ marginTop: 25 }}>
          <h2>Send a 180 degree servo to a set point</h2>
          <p>
            The range is -1000 to 1000.
            <br />
            0 is center, and -1000 and 1000 are the far ends.
            <br />
            The code on the robot will translate these ranges to the maximum and
            minimum set point of the servo.
            <br />
          </p>
          <strong>
            NOTE: In the future each servo will have data to locate:
          </strong>
          <ol>
            <li>&quot;perceived center&quot; of the mounted obj</li>
            <li>
              Physical maximum and minimum of the server as constrained by the
              structure
            </li>
          </ol>
          {servos}
        </div>
      )}
      <Button
        style={{ marginTop: 25 }}
        onClick={props.handleApiDocumentationButton}
      >
        Close
      </Button>
    </>
  );
};

export default ApiDocumentation;
