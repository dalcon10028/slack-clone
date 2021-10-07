import * as React from 'react';
import { Switch } from 'react-router';
import { BrowserRouter, Route } from 'react-router-dom';
import { ChannelList } from './components';
import { Channel } from './containers';
import { Container } from 'semantic-ui-react';

function App() {
  return (
    <BrowserRouter>
    <div id='wrapper'>
        <ChannelList />
        <main style={{ marginLeft: '16rem' }}>
            <Container>
                <Switch>
                    <Route
                        exact={true} path='/channels/:channelName' component={Channel} />
                    <Route
                        exact={true} path='/'
                        render={() => <h1>Sample Application</h1>} />
                </Switch>
            </Container>
        </main>
    </div>
</BrowserRouter >
  );
}

export default App;
