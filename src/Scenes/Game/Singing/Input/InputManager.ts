import events from 'Scenes/Game/Singing/GameState/GameStateEvents';
import GameStateEvents from 'Scenes/Game/Singing/GameState/GameStateEvents';
import gameStateEvents from 'Scenes/Game/Singing/GameState/GameStateEvents';
import DrawingTestInput from 'Scenes/Game/Singing/Input/DrawingTestInput';
import dummyInput from 'Scenes/Game/Singing/Input/DummyInput';
import MicInput from 'Scenes/Game/Singing/Input/MicInput';
import RemoteMicInput from 'Scenes/Game/Singing/Input/RemoteMicInput';
import { DrawingTestInputSource } from 'Scenes/SelectInput/InputSources/DrawingTest';
import { InputSourceNames } from 'Scenes/SelectInput/InputSources/interfaces';
import { MicrophoneInputSource } from 'Scenes/SelectInput/InputSources/Microphone';
import { RemoteMicrophoneInputSource } from 'Scenes/SelectInput/InputSources/Remote';
import storage from 'utils/storage';
import inputSourceListManager from 'Scenes/SelectInput/InputSources';

export interface SelectedPlayerInput {
    inputSource: InputSourceNames;
    deviceId?: string;
    channel: number;
}

const PLAYER_INPUTS_LOCAL_STORAGE_KEY = 'playerselectedinputs';

class InputManager {
    private isMonitoring = false;
    private requestingPromise: Promise<any> | null = null;
    private playerInputs: SelectedPlayerInput[] = storage.getValue(PLAYER_INPUTS_LOCAL_STORAGE_KEY) ?? [];

    constructor() {
        if (this.playerInputs.length === 0) {
            this.setPlayerInput(0, 'Dummy', 0, 'default');
            this.setPlayerInput(1, 'Dummy', 1, 'default');
        } else if (this.playerInputs.some((input) => input.inputSource === 'Microphone')) {
            // If any microphones are selected, load the list
            inputSourceListManager.loadMics();
        }

        GameStateEvents.inputListChanged.subscribe(async () => {
            if (this.isMonitoring) {
                await this.stopMonitoring();
                this.startMonitoring();
            }
        });
    }

    /**
     * Returns raw current selection with no guarantee that the device (eg mic, remote mic) is actually connected
     */
    public getRawInputs = () => this.playerInputs;

    public getPlayerFrequency = (playerNumber: number) => {
        const frequencies = this.sourceNameToInput(this.playerInputs[playerNumber].inputSource).getFrequencies(
            this.playerInputs[playerNumber].deviceId,
        );

        return frequencies[this.playerInputs[playerNumber].channel];
    };

    public getPlayerVolume = (playerNumber: number) => {
        const frequencies = this.sourceNameToInput(this.playerInputs[playerNumber].inputSource).getVolumes(
            this.playerInputs[playerNumber].deviceId,
        );

        return frequencies[this.playerInputs[playerNumber].channel];
    };

    public getPlayerInputLag = (playerNumber: number) =>
        this.sourceNameToInput(this.playerInputs[playerNumber].inputSource).getInputLag();

    public setPlayerInput = (playerNumber: number, source: InputSourceNames, channel = 0, deviceId?: string) => {
        // In case input change while monitoring stop monitoring everything and start monitoring after the change happen
        let restartMonitoringPromise: null | Promise<void> = null;
        if (this.isMonitoring) {
            restartMonitoringPromise = this.stopMonitoring();
        }

        const newInput = { inputSource: source, deviceId, channel };
        const oldInput = this.playerInputs[playerNumber];
        this.playerInputs[playerNumber] = newInput;

        storage.storeValue(PLAYER_INPUTS_LOCAL_STORAGE_KEY, this.playerInputs);
        events.playerInputChanged.dispatch(playerNumber, oldInput, newInput);

        if (restartMonitoringPromise) {
            restartMonitoringPromise.then(this.startMonitoring);
        }
    };

    public getPlayerInput = (playerNumber: number): SelectedPlayerInput | null =>
        this.playerInputs[playerNumber] ?? null;

    public startMonitoring = async () => {
        await Promise.all(
            this.playerInputs.map((playerInput) =>
                this.sourceNameToInput(playerInput.inputSource).startMonitoring(playerInput.deviceId),
            ),
        );
        this.isMonitoring = true;
    };

    public stopMonitoring = async () => {
        await Promise.all(
            this.playerInputs.map((playerInput) =>
                this.sourceNameToInput(playerInput.inputSource).stopMonitoring(playerInput.deviceId),
            ),
        );
        this.isMonitoring = false;
    };

    public getInputs = (): SelectedPlayerInput[] => {
        return this.playerInputs.map((input) =>
            inputSourceListManager.getInputForPlayerSelected(input, false)
                ? input
                : { inputSource: 'Dummy', deviceId: 'default', channel: 0 },
        );
    };

    public monitoringStarted = () => this.isMonitoring;

    public requestReadiness = async () => {
        if (!this.requestingPromise) {
            this.requestingPromise = new Promise((resolve) => {
                const request = async () => {
                    const allInputsConnected = !this.playerInputs.some(
                        (input) => inputSourceListManager.getInputForPlayerSelected(input, false) === null,
                    );

                    if (allInputsConnected) {
                        await Promise.all(
                            this.playerInputs.map((playerInput) =>
                                this.sourceNameToInput(playerInput.inputSource).requestReadiness(playerInput.deviceId),
                            ),
                        );
                        gameStateEvents.inputListChanged.unsubscribe(request);
                        this.requestingPromise = null;
                        resolve(true);
                    }
                };

                gameStateEvents.inputListChanged.subscribe(request);
                request();
            });
        }

        return this.requestingPromise;
    };

    // todo: Create eg. "InputSourceManager" and have the logic there?
    private sourceNameToInput = (sourceName: InputSourceNames) => {
        if (sourceName === MicrophoneInputSource.inputName) return MicInput;
        if (sourceName === DrawingTestInputSource.inputName) return DrawingTestInput;
        if (sourceName === RemoteMicrophoneInputSource.inputName) return RemoteMicInput;
        return dummyInput;
    };
}

export default new InputManager();
