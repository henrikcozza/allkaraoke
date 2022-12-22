import ConnectPhone from 'Scenes/ConnectPhone/ConnectPhone';
import useKeyboardNav from 'hooks/useKeyboardNav';
import { MenuButton } from 'Elements/Menu';
import { useEffect } from 'react';
import InputManager from 'Scenes/Game/Singing/Input/InputManager';
import { useEventListenerSelector } from 'Scenes/Game/Singing/Hooks/useEventListener';
import GameStateEvents from 'Scenes/Game/Singing/GameState/GameStateEvents';
import InputSources from 'Scenes/SelectInput/InputSources';
import { useRemoteMicAutoselect } from 'Scenes/SelectInput/hooks/useRemoteMicAutoselect';
import MicCheck from 'Scenes/SelectInput/MicCheck';

interface Props {
    onBack: () => void;
    onSave: () => void;
    closeButtonText: string;
}

function RemoteMics(props: Props) {
    const { register } = useKeyboardNav({ onBackspace: props.onBack });

    useEffect(() => {
        InputManager.startMonitoring();
        return () => {
            InputManager.stopMonitoring();
        };
    }, []);
    useRemoteMicAutoselect();

    const players = useEventListenerSelector(
        // Subscribing to inputListChanged otherwise as it's InputManager.getInputs returns dummy input as the input
        // list is not yet updated with the connected phone.
        // The event sequence is wrongly phoneConnected -> playerInputChanged -> inputListChanged - needs to be fixed
        // e.g. remove phoneConnected event?
        [GameStateEvents.inputListChanged, GameStateEvents.playerInputChanged],
        () => {
            console.log('players', InputManager.getInputs());
            return InputManager.getInputs()
                .filter((input) => input.inputSource === 'Remote Microphone')
                .map((input) => InputSources.getInputForPlayerSelected(input));
        },
    );

    const onContinue = () => {
        props.onSave();
    };

    return (
        <>
            <ConnectPhone />
            <h4>You can connect multiple phones in advance.</h4>

            <h4>You will be able to connect phones later.</h4>
            <MicCheck names={[players[0]?.label ?? '...', players[1]?.label ?? '...']} />
            <MenuButton {...register('back', props.onBack)} data-test="back-button">
                Back
            </MenuButton>
            <MenuButton {...register('Sing a song', onContinue, undefined, true)} data-test="save-button">
                {props.closeButtonText}
            </MenuButton>
        </>
    );
}

export default RemoteMics;