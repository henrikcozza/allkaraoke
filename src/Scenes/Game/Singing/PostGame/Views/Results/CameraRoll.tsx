import styled from '@emotion/styled';
import { useEffect, useRef, useState } from 'react';
import CameraManager from 'Camera/CameraManager';

interface Props {}

function CameraRoll({ ...props }: Props) {
    const [videoSrc, setVideoSrc] = useState('');
    const video = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        // Seems it needs some time to process the video, otherwise invalid URL is returned
        const timeout = setTimeout(() => {
            setVideoSrc(CameraManager.getVideo());
        }, 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        if (video.current) video.current.playbackRate = 8;
    }, [videoSrc]);

    return (
        <Container {...props}>
            <Video src={videoSrc} ref={video} loop autoPlay />
        </Container>
    );
}

const Container = styled.div`
    width: 80rem;
    height: 60rem;
`;

const Video = styled.video`
    object-fit: cover;
    width: 100%;
    height: 100%;
`;

export default CameraRoll;