import events from 'GameEvents/GameEvents';
import { WebRTCEvents, keyStrokes } from 'RemoteMic/Network/events';
import { getPingTime } from 'RemoteMic/Network/utils';
import SimplifiedMic from 'Scenes/Game/Singing/Input/SimplifiedMic';
import { throttle } from 'lodash-es';
import { DataConnection, Peer } from 'peerjs';
import peerJSOptions from 'utils/peerJSOptions';
import { v4 } from 'uuid';
import sendEvent from './sendEvent';

const MIC_ID_KEY = 'MIC_CLIENT_ID';

const roundTo = (num: number, precision: number) => {
    if (num === 0) return 0;

    const multiplier = Math.pow(10, precision);

    return Math.round(num * multiplier) / multiplier;
};

class WebRTCClient {
    private clientId = window.sessionStorage.getItem(MIC_ID_KEY);
    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    private reconnecting = false;
    private connected = false;

    private frequencies: number[] = [];

    private sendFrequencies = throttle((volume: number) => {
        const freqs = this.frequencies.map((freq) => roundTo(freq, 2));
        this.frequencies.length = 0;
        this.sendEvent('freq', [freqs, roundTo(volume, 4)]);
    }, 50);

    // Chunk frequencies and send them in packages
    // One package throttled with 75ms contains ~10 frequencies
    private onFrequencyUpdate = throttle((freq: number, volume: number) => {
        this.frequencies.push(freq);

        this.sendFrequencies(volume);
    }, 1_000 / 60);

    private setClientId = (id: string) => {
        this.clientId = id;
        window.sessionStorage.setItem(MIC_ID_KEY, id);
    };

    private unavailableIdRetries = 0;
    private unavailableIdRetryTimeout: any = null;

    public connect = (roomId: string, name: string, silent: boolean) => {
        if (this.clientId === null) this.setClientId(v4());

        this.peer = new Peer(this.clientId!, { ...peerJSOptions, debug: 3 });

        this.peer.on('open', () => this.connectToServer(roomId, name, silent));
        this.peer.on('close', () => {
            SimplifiedMic.removeListener(this.onFrequencyUpdate);
            SimplifiedMic.stopMonitoring();
        });

        this.peer.on('error', (e) => {
            // Happens when the device goes from offline to online
            if (
                e.type === 'unavailable-id' &&
                this.unavailableIdRetries < 3 &&
                this.unavailableIdRetryTimeout === null
            ) {
                this.peer?.destroy?.();
                this.unavailableIdRetryTimeout = setTimeout(() => {
                    this.unavailableIdRetryTimeout = null;
                    this.unavailableIdRetries++;
                    this.connect(roomId, name, silent);
                }, 750);
            } else {
                this.unavailableIdRetries = 0;
                console.error(e.type, e);

                if (!this.connected && !this.reconnecting) {
                    events.karaokeConnectionStatusChange.dispatch('error', e.type);
                }
            }
        });
    };

    public latency = 999;
    public pingStart = Date.now();
    public pinging = false;
    private ping = () => {
        this.pinging = true;
        this.pingStart = getPingTime();

        this.sendEvent('ping', { p: this.pingStart });
    };

    private onPong = () => {
        this.latency = getPingTime() - this.pingStart;
        this.pinging = false;

        setTimeout(this.ping, 1000);
    };

    public connectToServer = (roomId: string, name: string, silent: boolean) => {
        events.karaokeConnectionStatusChange.dispatch('connecting');
        this.connection = this.peer!.connect(roomId);

        this.connection.on('open', () => {
            this.reconnecting = false;
            this.connected = true;

            window.addEventListener('beforeunload', this.disconnect);

            this.sendEvent('register', { name, id: this.clientId!, silent });
            this.ping();

            events.karaokeConnectionStatusChange.dispatch('connected');

            this.connection?.on('data', (data: WebRTCEvents) => {
                const type = data.t;
                console.log('data', data);
                if (type === 'start-monitor') {
                    SimplifiedMic.addListener(this.onFrequencyUpdate);
                    // echoCancellation is turned on because without it there is silence from the mic
                    // every other second (possibly some kind of Chrome Mobile bug)
                    SimplifiedMic.startMonitoring(undefined, true);
                } else if (type === 'stop-monitor') {
                    SimplifiedMic.removeListener(this.onFrequencyUpdate);
                    SimplifiedMic.stopMonitoring();
                } else if (type === 'set-player-number') {
                    events.remoteMicPlayerSet.dispatch(data.playerNumber);
                } else if (type === 'keyboard-layout') {
                    events.remoteKeyboardLayout.dispatch(data.help);
                } else if (type === 'reload-mic') {
                    window.removeEventListener('beforeunload', this.disconnect);
                    this.sendEvent('unregister');
                    window.sessionStorage.setItem('reload-mic-request', '1');
                    document.getElementById('phone-ui-container')?.remove();
                    window.location.reload();
                } else if (type === 'request-readiness') {
                    events.remoteReadinessRequested.dispatch();
                } else if (type === 'pong') {
                    this.onPong();
                } else if (type === 'ping') {
                    this.sendEvent('pong');
                }
            });
        });

        this.connection.on('error', console.warn);

        this.connection.on('close', () => {
            window.removeEventListener('beforeunload', this.disconnect);

            events.karaokeConnectionStatusChange.dispatch('disconnected');
            events.remoteMicPlayerSet.dispatch(null);
            SimplifiedMic.removeListener(this.onFrequencyUpdate);
            SimplifiedMic.stopMonitoring();

            console.log('closed connection :o');

            this.connected = false;
            this.reconnecting = true;
            setTimeout(() => this.reconnect(roomId, name), 500);
        });
    };

    private reconnect = (roomId: string, name: string) => {
        if (this.reconnecting) {
            events.karaokeConnectionStatusChange.dispatch('reconnecting');
            this.connectToServer(roomId, name, false);
            setTimeout(() => this.reconnect(roomId, name), 1000);
        }
    };

    public sendKeyStroke = (key: keyStrokes) => {
        this.sendEvent('keystroke', { key });
    };

    public requestPlayerChange = (playerNumber: number | null) => {
        this.sendEvent('request-mic-select', { playerNumber });
    };

    public confirmReadiness = () => {
        this.sendEvent('confirm-readiness');
    };

    private sendEvent = <T extends WebRTCEvents>(type: T['t'], payload?: Parameters<typeof sendEvent<T>>[2]) => {
        sendEvent(this.connection, type, payload);
    };

    private disconnect = () => {
        this.connection?.close();
    };
}

export default new WebRTCClient();
