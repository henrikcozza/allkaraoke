import events from 'GameEvents/GameEvents';
import PlayersManager from 'Players/PlayersManager';
import RemoteMicManager from 'RemoteMic/RemoteMicManager';
import InputManager from 'Scenes/Game/Singing/Input/InputManager';
import { RemoteMicrophoneInputSource } from 'Scenes/SelectInput/InputSources/Remote';
import { toast } from 'react-toastify';

events.playerInputChanged.subscribe((playerNumber, oldInput, newInput) => {
    if (oldInput?.source === RemoteMicrophoneInputSource.inputName) {
        const playerNumber = PlayersManager.getPlayers().find(
            (player) => player.input.source === 'Remote Microphone' && player.input.deviceId === oldInput.deviceId,
        )?.number;
        const unselectedRemoteMic = RemoteMicManager.getRemoteMicById(oldInput.deviceId!);

        unselectedRemoteMic?.setPlayerNumber(playerNumber !== undefined ? playerNumber : null);
    }
    if (newInput?.source === 'Remote Microphone') {
        const selectedRemoteMic = RemoteMicManager.getRemoteMicById(newInput.deviceId!);

        selectedRemoteMic?.setPlayerNumber(playerNumber);
    }
});
events.remoteMicConnected.subscribe(({ id }) => {
    const playerNumberIndex = PlayersManager.getPlayers().find(
        (player) => player.input.source === 'Remote Microphone' && player.input.deviceId === id,
    )?.number;

    if (playerNumberIndex !== undefined) {
        const remoteMic = RemoteMicManager.getRemoteMicById(id);

        remoteMic?.setPlayerNumber(playerNumberIndex);

        if (InputManager.monitoringStarted()) {
            remoteMic?.getInput()?.startMonitoring();
        }
    }
});

events.playerChangeRequested.subscribe((phoneId, newPlayerNumber) => {
    const currentPlayerNumber = PlayersManager.getPlayers().find((player) => player.input.deviceId === phoneId)?.number;

    if (currentPlayerNumber !== undefined) {
        PlayersManager.getPlayer(currentPlayerNumber).changeInput('Dummy', 0);
    }
    if (newPlayerNumber !== null) {
        PlayersManager.getPlayer(newPlayerNumber).changeInput('Remote Microphone', 0, phoneId);
    }
});

events.remoteMicConnected.subscribe(({ name, silent }) => {
    if (!silent) {
        toast.success(
            <>
                Remote microphone <b className="ph-no-capture">{name}</b> connected!
            </>,
        );
    }
});
events.remoteMicDisconnected.subscribe(({ name }, silent) => {
    if (!silent) {
        toast.warning(
            <>
                Remote microphone <b className="ph-no-capture">{name}</b> disconnected!
            </>,
        );
    }
});
