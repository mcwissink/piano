import React from 'react';
import io from 'socket.io-client';
import update from 'immutability-helper';
import { Switch, Route, RouteComponentProps } from 'react-router-dom';
import './App.css';

import RoomList from './components/RoomList';
import Settings from './components/Settings';
import Room from './components/Room';
import { calculateBlurByImageSize } from './util/calculateBackgroundBlurFromImage';

export interface IChat {
  user: IUser;
  message: string;
}


export interface IRoom {
  id: string;
  name: string;
  likes: number;
  users: number;
  owner: string;
}

export interface IUser {
  id: string;
  name: string;
  color: string;
}

export interface ITheme {
  primary: string;
  secondary: string;
  image: string;
}

interface IPermissions {
  admin: boolean;
  play: boolean;
}

interface IAppState {
  rooms: IRoom[];
  room: {
    permissions: IPermissions;
    name: string;
    chat: IChat[];
    users: IUser[];
  };
  name: string;
  color: string;
  theme: ITheme;
}

interface IAppPartialContext extends IAppState {
  socket?: SocketIOClient.Socket; 
  modifier?: AppModifier;
}

export interface IAppContext extends IAppPartialContext {
  socket: SocketIOClient.Socket;
  modifier: AppModifier;
}

const initialState = {
  rooms: [],
  name: 'Anonymous',
  color: '#000000',
  room: {
    permissions: { admin: false, play: false },
    name: '',
    chat: [],
    users: [],
  },
  theme: {
    primary: '#ffffff',
    secondary: '#000000',
    image: '',
  },
}
export const AppContext = React.createContext<IAppPartialContext>(initialState);

class App extends React.PureComponent<{}, IAppState> {
  modifier: AppModifier;
  socket: SocketIOClient.Socket;
  constructor(props: {}) {
    super(props);
    this.state = initialState;
    this.modifier = new AppModifier(this);
    
    this.socket = io('localhost:3001', {
      transports: ['websocket']
    });
    this.socket.on('reconnect_attempt', () => {
      this.socket.io.opts.transports = ['polling', 'websocket'];
    });
    this.socket.on('connect_error', () => console.log("error"));
    this.socket.on('connect', () => console.log("connected"));
    this.socket.on('chat', this.modifier.chatEvent);
    this.socket.on('init', this.modifier.initEvent);
    this.socket.on('roomList', this.modifier.roomListEvent);
    this.socket.on('room', this.modifier.roomEvent);
    this.socket.emit('init');

  };

  
  routeRoom = ({ match }: RouteComponentProps<{ id: string }>) => <Room id={match.params.id} />;
  
  render() {
    return (
      <AppContext.Provider value={{
        socket: this.socket,
        modifier: this.modifier,
        ...this.state,
      }}>
        <div id="pianoPageBackground" style={{ backgroundImage: `url(${this.state.theme.image})`, MozBackgroundSize: 'cover', filter: `blur(${ calculateBlurByImageSize(this.state.theme.image) }px)` }} />
        <div id="content">
          <Settings />
          <RoomList />
          <Switch>
            <Route path="/room/:id" component={this.routeRoom} />
          </Switch>
        </div>
      </AppContext.Provider>
    );
  }
}

// Probably reimplementing redux in a worse way, but as long as there are no performance hits, it's ok
class AppModifier {
  app: App;
  constructor(app: App) {
    this.app = app;
  }
  
  roomListEvent = (data: IRoom[]) => {
    console.log(data);
    this.app.setState({ rooms: data });
  }

  initEvent = (data: {
    name: string,
    color: string,
  })=> {
    this.app.setState(data);
  }

  chatEvent = (data: IChat) => {
    console.log(data);
    this.app.setState(oldState => update(oldState, {
      room: {
        chat: { $push: [data] },
      },
    }));
  }
  
  roomEvent = (data: { permissions: IPermissions, name: string, users: IUser[], theme: ITheme }) => {
    this.onThemeChange(data.theme);
    console.log(data.permissions);
    this.app.setState(oldState => update(oldState, {
      room: {
        permissions: { $set: data.permissions },
        name: { $set: data.name },
        users: { $set: data.users },
      }
    }));
  }

  onThemeChange = (theme: ITheme) => {
    this.app.setState({ theme });
  }

  onColorChange = (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.app.setState({ color: e.currentTarget.value });
  }
}

export function withContext<P extends object>(WrappedComponent: React.ComponentType<P & IAppContext>): React.ComponentType<P> {
  return class ContextComponent extends React.Component<P> {
    render() {
      return <AppContext.Consumer>
        {value => {
          if (value.socket === undefined || value.modifier === undefined) {
            return null;
          } else {
            return (
              <WrappedComponent
                socket={value.socket}
                modifier={value.modifier}
                {...value}
                {...this.props}/>
            );
          }
        }}
      </AppContext.Consumer>
    }
  }
}

export default App;
