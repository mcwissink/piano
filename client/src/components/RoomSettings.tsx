import React from "react";
import update from 'immutability-helper';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { ITheme, IAppContext, withContext } from '../App';
import Button from "./Button";


interface IRoomSettingsState {
  name: string;
  theme: ITheme;
}

type IProps = {
  roomName?: string;
} & IAppContext & RouteComponentProps;
class RoomSettings extends React.PureComponent<IProps, IRoomSettingsState> {
  socket: SocketIOClient.Socket;
  constructor(props: IProps) {
    super(props);
    this.socket = props.socket;
    const theme = props.roomName === undefined ? {
      primary: '#ffffff',
      secondary: '#000000',
      image: '',
    } : props.theme;
    this.state = {
      name: props.roomName === undefined ? '' : props.roomName,
      theme,
    };

  }

  canSubmit = () => {
    const {
      name,
    } = this.state;
    return this.props.roomName === undefined ? (name !== '' && this.props.rooms.find(room => room.name === name) === undefined) : true;
  }

  onRoomSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {
      name,
      theme,
    } = this.state;
    const parsedName = name.trim();
    if (this.canSubmit()) {
      if (this.props.roomName === undefined) {
        console.log('creating a room');
        this.socket.emit('createRoom', {
          name: parsedName,
          theme,
        }, (roomName?: string) => {
          if (roomName !== undefined) {
            this.props.history.push(`/room/${encodeURIComponent(roomName)}`);
          }
        }); 
      } else {
        this.socket.emit('updateRoom', {
          theme,
        });
      }
    }
  };

  onNameChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({ name: e.currentTarget.value });
  }


  onPrimaryChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
        // Find a way to make this more React-like.
    // This is a work around to get a better styling on the color picker without using unofficial CSS selectors
    // Copy from https://stackoverflow.com/a/11471224/2930176
    const color_picker: HTMLInputElement | null = document.getElementById("color-picker-2") as HTMLInputElement;
    const color_picker_wrapper = document.getElementById("color-picker-wrapper-2");
    if (color_picker_wrapper !== null && color_picker !== null && color_picker.value !== null) {
      color_picker_wrapper.style.backgroundColor = color_picker.value;
      color_picker_wrapper.style.backgroundColor = color_picker.value;
    }
    const color = e.currentTarget.value;
    this.setState(oldState => update(oldState, {
      theme: {
        primary: { $set: color },
      },
    }));
  }

  onSecondaryChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
        // Find a way to make this more React-like.
    // This is a work around to get a better styling on the color picker without using unofficial CSS selectors
    // Copy from https://stackoverflow.com/a/11471224/2930176
    const color_picker: HTMLInputElement | null = document.getElementById("color-picker-3") as HTMLInputElement;
    const color_picker_wrapper = document.getElementById("color-picker-wrapper-3");
    if (color_picker_wrapper !== null && color_picker !== null && color_picker.value !== null) {
      color_picker_wrapper.style.backgroundColor = color_picker.value;
      color_picker_wrapper.style.backgroundColor = color_picker.value;
    }
    const color = e.currentTarget.value;
    this.setState(oldState => update(oldState, {
      theme: {
        secondary: { $set: color },
      },
    }));
  }
  onImageChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    const color = e.currentTarget.value;
    this.setState(oldState => update(oldState, {
      theme: {
        image: { $set: color },
      },
    }));
  }

  render() {
    const {
      name,
      theme,
    } = this.state;
    const hasRoom = this.props.roomName !== undefined;
    return (
      <div>
        <h1>New Room</h1>
        <form onSubmit={this.onRoomSubmit}>
          {hasRoom ? null : <input placeholder="New Room Name" type="text" value={name} onChange={this.onNameChange} />}
          <div id="color-picker-wrapper-2" style={{backgroundColor: this.props.theme.primary, marginRight: '1em'}}>
            <input id="color-picker-2" type="color" value={theme.primary} onChange={this.onPrimaryChange} />
          </div>
          <div id="color-picker-wrapper-3" style={{backgroundColor: this.props.theme.primary, marginRight: '1em'}}>
            <input id="color-picker-3" type="color" value={theme.secondary} onChange={this.onSecondaryChange} />
          </div>
          <input placeholder="Image URL" type="text" value={theme.image} onChange={this.onImageChange} />
          <Button type="submit" value={`${hasRoom ? 'Update' : 'Create'} Room`} disabled={!this.canSubmit()} />
        </form>
      </div>
    )
  }
}

export default withRouter(withContext(RoomSettings));
