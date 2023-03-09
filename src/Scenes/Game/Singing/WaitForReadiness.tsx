import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import InputManager from 'Scenes/Game/Singing/Input/InputManager';
import { typography } from 'Elements/cssMixins';
import { useEventEffect, useEventListenerSelector } from 'Scenes/Game/Singing/Hooks/useEventListener';
import gameStateEvents from 'Scenes/Game/Singing/GameState/GameStateEvents';
import GameStateEvents from 'Scenes/Game/Singing/GameState/GameStateEvents';
import GameState from 'Scenes/Game/Singing/GameState/GameState';
import { CircularProgress } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';

interface Props {
    onFinish: () => void;
}
function WaitForReadiness({ onFinish }: Props) {
    const [areAllPlayersReady, setAreAllPlayersReady] = useState(false);

    const [confirmedPlayers, setConfirmedPlayers] = useState<string[]>([]);
    useEventEffect(gameStateEvents.readinessConfirmed, (deviceId) => {
        setConfirmedPlayers((current) => [...current, deviceId]);
    });

    const players = useEventListenerSelector(
        [gameStateEvents.inputListChanged, GameStateEvents.readinessConfirmed],
        () => {
            return InputManager.getInputs().map((input, index) => [
                input.deviceId!,
                GameState.getPlayers()[index]?.getName() ?? undefined,
            ]);
        },
    );

    useEffect(() => {
        const inputsReady = InputManager.requestReadiness().then(() => setAreAllPlayersReady(true));
        const minTimeElapsed = new Promise((resolve) => setTimeout(resolve, 3_000));
        const maxTimeElapsed = new Promise((resolve) => setTimeout(resolve, 15_000));

        Promise.race([Promise.all([inputsReady, minTimeElapsed]), maxTimeElapsed]).then(() => {
            onFinish();
        });
    }, []);

    const playerStatuses = players.map(([deviceId, name]) => ({
        confirmed: confirmedPlayers.includes(deviceId),
        name,
    }));

    return (
        <>
            {!areAllPlayersReady && (
                <WaitingForReady>
                    <span>
                        Waiting for all players to click <strong>"Ready"</strong>
                    </span>
                    <PlayerList>
                        {playerStatuses.map(({ confirmed, name }, index) => (
                            <PlayerEntry
                                key={index}
                                data-test="player-confirm-status"
                                data-name={name}
                                data-confirmed={confirmed}>
                                {confirmed ? <CheckCircleOutline /> : <CircularProgress color="info" size="1em" />}{' '}
                                {name ? name : 'Connecting...'}
                            </PlayerEntry>
                        ))}
                    </PlayerList>
                </WaitingForReady>
            )}
        </>
    );
}

const WaitingForReady = styled.div`
    top: 0;
    left: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    position: absolute;
    width: 100%;
    height: 100%;

    font-size: 7rem;
    ${typography};
`;

const PlayerList = styled.div`
    margin-top: 5rem;
    display: flex;
    flex-direction: column;
    gap: 5rem;
`;

const PlayerEntry = styled.div`
    display: flex;
    align-items: center;
    //justify-content: center;
    gap: 2rem;
    svg {
        width: 7rem;
        height: 7rem;
        stroke: black;
    }
`;

export default WaitForReadiness;