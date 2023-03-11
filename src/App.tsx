import styled from '@emotion/styled';
import { KeyboardHelpProvider } from 'Scenes/KeyboardHelp/Context';
import Settings from 'Scenes/Settings/Settings';
import { Route, Router } from 'wouter';
import Convert from './Scenes/Convert/Convert';
import Edit from './Scenes/Edit/Edit';
import SongList from './Scenes/Edit/SongList';
import Game from './Scenes/Game/Game';
import Jukebox from './Scenes/Jukebox/Jukebox';
import Phone from './Scenes/Phone/Phone';
import SelectInput from './Scenes/SelectInput/SelectInput';
import * as Sentry from '@sentry/react';

import GetSongsBPMs from 'Scenes/Edit/GetSongsBPMs';
import 'utils/exposeSingletons';
import 'Stats';
import 'RemoteMic/eventListeners';
import QuickSetup from 'Scenes/QuickSetup/QuickSetup';
import { MicSetupPreferenceSetting, useSettingValue } from 'Scenes/Settings/SettingsState';
import Welcome from 'Scenes/Welcome/Welcome';
import styles from 'styles';
import { ErrorFallback } from 'Elements/ErrorFallback';
import Toolbar from 'Toolbar/Toolbar';

function App() {
    const [setupPreference] = useSettingValue(MicSetupPreferenceSetting);

    return (
        <>
            <Sentry.ErrorBoundary fallback={ErrorFallback}>
                <KeyboardHelpProvider>
                    <Router>
                        <GameScreens>
                            <Toolbar />
                            <Route path="/game/:file">{({ file }) => <Game file={decodeURIComponent(file!)} />}</Route>
                            <Route path="/game">{() => <Game />}</Route>
                            <Route path="/jukebox" component={Jukebox} />
                            <Route path="/phone/:roomId">{({ roomId }) => <Phone roomId={roomId!} />}</Route>
                            <Route path="/select-input" component={SelectInput} />
                            <Route path="/settings" component={Settings} />
                            {setupPreference === null ? (
                                <Route path="/" component={QuickSetup} />
                            ) : (
                                <Route path="/" component={Welcome} />
                            )}
                        </GameScreens>
                        <Route path="/convert" component={() => <Convert />} />
                        <Route path="/edit" component={SongList} />
                        <Route path="/edit/get-songs-bpms" component={GetSongsBPMs} />
                        <Route path="/edit/:filename">{({ filename }) => <Edit file={filename!} />}</Route>
                    </Router>
                </KeyboardHelpProvider>
            </Sentry.ErrorBoundary>
        </>
    );
}

const GameScreens = styled.div`
    ${styles};
`;

export default App;
