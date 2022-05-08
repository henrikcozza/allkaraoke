import { Button } from 'Elements/Button';
import { navigate } from 'hooks/useHashLocation';
import useKeyboardNav from 'hooks/useKeyboardNav';
import { SongPreview } from 'interfaces';
import { shuffle } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import YouTube from 'react-youtube';
import styled from 'styled-components';
import { Link } from 'wouter';
import usePlayerVolume from '../../hooks/usePlayerVolume';
import useUnstuckYouTubePlayer from '../../hooks/useUnstuckYouTubePlayer';
import useViewportSize from '../../hooks/useViewportSize';
import SongPage from '../Game/SongPage';

interface Props {}

function Jukebox(props: Props) {
    const { width, height } = useViewportSize();
    const player = useRef<YouTube | null>(null);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(0);
    const songList = useQuery<SongPreview[]>('songList', () =>
        fetch('./songs/index.json').then((response) => response.json()),
    );
    const [currentStatus, setCurrentStatus] = useState(YouTube.PlayerState.UNSTARTED);

    const [shuffledList, setShuffledList] = useState<SongPreview[]>([]);
    const { register } = useKeyboardNav({ onBackspace: () => navigate('/') });

    useEffect(() => songList.data && setShuffledList(shuffle(songList.data)), [songList.data]);

    const playNext = () => songList.data && setCurrentlyPlaying((current) => (current + 1) % songList.data.length);

    const playerKey = useUnstuckYouTubePlayer(player, currentStatus);
    usePlayerVolume(player, shuffledList[currentlyPlaying]?.volume);
    useEffect(() => {
        if (!player.current) {
            return;
        }

        player.current.getInternalPlayer().setSize(width, height);
    }, [player, width, height, shuffledList, currentlyPlaying, playerKey]);

    if (!shuffledList.length || !width || !height) return null;

    const navigateUrl = `/game/${encodeURIComponent(shuffledList[currentlyPlaying].file)}`;

    return (
        <SongPage
            width={width}
            height={height}
            songData={shuffledList[currentlyPlaying]}
            data-test="jukebox-container"
            data-song={shuffledList[currentlyPlaying].file}
            background={
                <YouTube
                    title=" "
                    key={`${shuffledList[currentlyPlaying].video}-${playerKey}`}
                    ref={player}
                    videoId={shuffledList[currentlyPlaying].video}
                    opts={{
                        width: '0',
                        height: '0',
                        playerVars: {
                            autoplay: 1,
                            showinfo: 1,
                            rel: 0,
                            fs: 0,
                            controls: 1,
                            start: shuffledList[currentlyPlaying].videoGap ?? 0,
                        },
                    }}
                    onStateChange={(e) => {
                        if (e.data === YouTube.PlayerState.ENDED) playNext();
                        setCurrentStatus(e.data);
                    }}
                />
            }>
            <SkipSongButton {...register('skip', playNext)}>Skip</SkipSongButton>
            <Link to={navigateUrl}>
                <PlayThisSongButton {...register('sing a song', () => navigate(navigateUrl), undefined, true)}>
                    Sing this song
                </PlayThisSongButton>
            </Link>
        </SongPage>
    );
}

const PlayThisSongButton = styled(Button)<{ focused: boolean }>`
    bottom: 70px;
    right: 20px;
    width: 500px;
    position: absolute;
    font-size: 1.9vw;
`;

const SkipSongButton = styled(Button)<{ focused: boolean }>`
    bottom: 150px;
    right: 20px;
    width: 300px;
    position: absolute;
    font-size: 1.9vw;
`;

export default Jukebox;
