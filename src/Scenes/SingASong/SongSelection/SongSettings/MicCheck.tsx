import styled from '@emotion/styled';
import { typography } from 'Elements/cssMixins';
import events from 'GameEvents/GameEvents';
import { useEventListener, useEventListenerSelector } from 'GameEvents/hooks';
import PlayersManager from 'Players/PlayersManager';
import InputManager from 'Scenes/Game/Singing/Input/InputManager';
import NoiseDetection from 'Scenes/SingASong/SongSelection/SongSettings/MicCheck/NoiseDetection';
import SinglePlayer from 'Scenes/SingASong/SongSelection/SongSettings/MicCheck/SinglePlayer';
import { ComponentProps, useEffect } from 'react';

export default function MicCheck(props: ComponentProps<typeof Container>) {
  // Force update when the name changes
  useEventListener(events.playerNameChanged);

  useEffect(() => {
    InputManager.startMonitoring();
  }, []);

  const inputs = useEventListenerSelector(events.playerInputChanged, () => PlayersManager.getInputs());
  const isSetup = inputs.some((input) => input.source !== 'Dummy');

  return (
    <Container {...props}>
      <MicChecksContainer>
        Microphone Check
        {isSetup ? (
          PlayersManager.getPlayers().map((player) => <SinglePlayer key={player.number} player={player} />)
        ) : (
          <>
            <Indicator>Mic not setup</Indicator>
            <h4>Singing will be emulated</h4>
            <h5>You can setup in the Next step</h5>
          </>
        )}
      </MicChecksContainer>
      <NoiseDetection />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  font-size: 3rem;
  ${typography};
  margin-bottom: 8.6rem;
  gap: 3.5rem;
`;

const MicChecksContainer = styled.div`
  gap: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Indicator = styled.div`
  position: relative;
  border: 0.1rem solid white;
  padding: 1rem 3rem;
  background: black;
  width: 80%;

  text-align: center;
  gap: 1.25rem;
  font-size: 2.3rem;
  color: white;
`;
