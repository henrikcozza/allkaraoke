import events from 'GameEvents/GameEvents';
import { useEventListener } from 'GameEvents/hooks';
import SimplifiedMic from 'Scenes/Game/Singing/Input/SimplifiedMic';
import { throttle } from 'lodash-es';
import { useCallback, useEffect, useState } from 'react';
import VolumeIndicator from './VolumeIndicator';

interface Props {
    isVisible: boolean;
    isMicOn: boolean;
    isConnected: boolean;
}

function MicPreview({ isVisible, isMicOn, isConnected }: Props) {
    const [volume, setVolume] = useState(0);
    const [frequency, setFrequency] = useState(0);
    const [playerNumber] = useEventListener(events.remoteMicPlayerSet) ?? [null];

    const updateVolumes = useCallback(
        throttle((freq: number, volume: number) => {
            setFrequency(freq);
            setVolume(volume);
        }, 150),
        [setVolume, setFrequency],
    );

    useEffect(() => {
        SimplifiedMic.startMonitoring(undefined);
        return SimplifiedMic.addListener(updateVolumes);
    }, [updateVolumes]);

    return isVisible ? (
        <>
            <VolumeIndicator
                volume={volume}
                frequency={frequency}
                playerNumber={playerNumber}
                isMicOn={isMicOn}
                isConnected={isConnected}
            />
        </>
    ) : null;
}
export default MicPreview;
