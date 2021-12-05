import React, { Component } from 'react';
import nipplejs from 'nipplejs';

class JoystickControl extends Component {
  constructor(props) {
    super(props);
    this.state = {
      joystickOutput: 'Use finger or mouse to drive robot!',
    };
  }
  // const [joystickOutput, setJoystickOutput] = useState(
  //   'Use finger or mouse to drive!',
  // );

  /*
  const joystickContainer = useRef(null);

    const options = {
      // zone: document.getElementById('virtual-joystick-container')
      zone: joystickContainer,
    };

    // Create new joystick
    const joystick = nipplejs.create(options);

    /* Use this to dump ALL data it can give you for testing.
      this.joystick.on('start end', function (evt, data) {
          console.log(evt.type);
          console.log(data);
      }).on('move', function (evt, data) {
          console.log(evt.type);
          console.log(data);
      }).on('dir:up plain:up dir:left plain:left dir:down ' +
          'plain:down dir:right plain:right',
          function (evt, data) {
              console.log(evt.type);
              console.log(data);
          }
      ).on('pressure', function (evt, data) {
          console.log(evt.type);
          console.log({
              pressure: data
          });
      });
      */

  // Create event listeners and event handlers for new joystick
  /*
    joystick
      .on('start end', () => {
        // evt, data
        // console.log(evt.type);
        // console.log(data);
        const linearSpeed = 0;
        const angularSpeed = 0;
        setJoystickOutput(
          `LinearSpeed: ${linearSpeed}, AngularSpeed: ${angularSpeed}`,
        );
        // TODO: Send the data over the socket connection.
      })
      .on('move', (evt, data) => {
        // console.log(evt.type);
        // console.log(data);
        // console.log(data.angle.radian);
        // console.log(data.distance);
        // https://math.stackexchange.com/questions/143932/calculate-point-given-x-y-angle-and-distance
        // x=5cosθ , y=5sinθ.
        // θ is the angle between the line of sight from the entity
        // to the point and the positive x axis.
        // console.log(Math.sin(45 * (Math.PI / 180)) * 5);
        const joystickXfromCenter = Math.cos(data.angle.radian) * data.distance;
        const joystickYfromCenter = Math.sin(data.angle.radian) * data.distance;
        const DECREASER = 100;
        const linearSpeed =
          Math.round((joystickYfromCenter / DECREASER) * 100) / 100;
        // Angular is reversed.
        const angularSpeed =
          Math.round((-joystickXfromCenter / DECREASER) * 100) / 100;
        setJoystickOutput(
          `LinearSpeed: ${linearSpeed}, AngularSpeed: ${angularSpeed}`,
        );
        // TODO: Send the data over the socket connection.
      });
    */

  componentDidMount() {
    if (!this.joystick) {
      const options = {
        // zone: document.getElementById('virtual-joystick-container')
        zone: this.joystickContainer,
        size: 200,
      };

      // Create new joystick
      this.joystick = nipplejs.create(options);

      // console.log(this.joystick);

      /* Use this to dump ALL data it can give you for testing.
        this.joystick.on('start end', function (evt, data) {
            console.log(evt.type);
            console.log(data);
        }).on('move', function (evt, data) {
            console.log(evt.type);
            console.log(data);
        }).on('dir:up plain:up dir:left plain:left dir:down ' +
            'plain:down dir:right plain:right',
            function (evt, data) {
                console.log(evt.type);
                console.log(data);
            }
        ).on('pressure', function (evt, data) {
            console.log(evt.type);
            console.log({
                pressure: data
            });
        });
        */

      // Create event listeners and event handlers for new joystick
      this.joystick
        .on('start end', () => {
          // evt, data
          // console.log(evt.type);
          // console.log(data);
          const linearSpeed = 0;
          const angularSpeed = 0;
          this.setState({
            joystickOutput: `LinearSpeed: ${linearSpeed}, AngularSpeed: ${angularSpeed}`,
          });
          this.props.socket.emit('motor', {
            target: this.props.name,
            value: linearSpeed,
            angle: angularSpeed,
          });
        })
        .on('move', (evt, data) => {
          // console.log(evt.type);
          // console.log(data);
          // console.log(data.angle.radian);
          // console.log(data.distance);
          // https://math.stackexchange.com/questions/143932/calculate-point-given-x-y-angle-and-distance
          // x=5cosθ , y=5sinθ.
          // θ is the angle between the line of sight from the entity
          // to the point and the positive x axis.
          // console.log(Math.sin(45 * (Math.PI / 180)) * 5);
          // console.log(data.distance, data.angle);
          const joystickXfromCenter =
            Math.cos(data.angle.radian) * data.distance;
          const joystickYfromCenter =
            Math.sin(data.angle.radian) * data.distance;
          // TODO: Rather than randomly doing this, we should somehow tie this to the actual max speed of the motors? I think?
          const DECREASER = 0.01; // To make the max equal 1000 like the sliders.
          const linearSpeed =
            Math.round(joystickYfromCenter * DECREASER * 100) / 100;
          // Angular is reversed.
          const angularSpeed =
            Math.round(-joystickXfromCenter * DECREASER * 100) / 100;
          this.setState({
            joystickOutput: `LinearSpeed: ${linearSpeed}, AngularSpeed: ${angularSpeed}`,
          });
          this.props.socket.emit('motor', {
            target: this.props.name,
            twist: {
              linearSpeed,
              angularSpeed,
            },
          });
        });
    }
  }

  render() {
    return (
      <>
        {this.state.joystickOutput}
        <span id="virtual-joystick-result" />
        <div
          style={{ height: 250, width: 250, border: 'solid' }}
          id="virtual-joystick-container"
          // https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
          ref={(div) => {
            this.joystickContainer = div;
          }}
        />
      </>
    );
  }
}

export default JoystickControl;
