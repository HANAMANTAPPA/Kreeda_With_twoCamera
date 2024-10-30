import React, { useEffect, useRef } from 'react';
import { Pose } from '@mediapipe/pose';

function PoseEstimationComponent() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const targetDeviceId = "f8f36839eacc497e6cc7a671cd96fd01cc9bd4be3779106ae6e1ba39f68a04fb";

    useEffect(() => {
        async function initializeCamera() {
            try {
                // Select the intended device by deviceId
                const constraints = {
                    video: { deviceId: { exact: targetDeviceId } }
                };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                        initializePoseEstimation();
                    };
                }

            } catch (error) {
                console.error("Error accessing the camera:", error);
            }
        }

        function initializePoseEstimation() {
            const pose = new Pose({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            pose.onResults(handlePoseResults);

            // Set up a loop to feed video frames to Pose manually
            const sendFrame = async () => {
                if (videoRef.current) {
                    await pose.send({ image: videoRef.current });
                    requestAnimationFrame(sendFrame);
                }
            };

            // Start the manual frame sending loop
            sendFrame();
        }

        function handlePoseResults(results) {
            const canvas = canvasRef.current;
            const canvasCtx = canvas.getContext('2d');

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the video frame onto the canvas
            canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            // Draw pose landmarks if available
            if (results.poseLandmarks) {
                canvasCtx.fillStyle = 'red';
                results.poseLandmarks.forEach(landmark => {
                    canvasCtx.beginPath();
                    canvasCtx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
                    canvasCtx.fill();
                });
            }
        }

        initializeCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '640px', height: '480px' }}>
            <video ref={videoRef} style={{ display: 'none' }} />
            <canvas ref={canvasRef} width="640" height="480" style={{ position: 'absolute', top: 0, left: 0 }} />
        </div>
    );
}

export default PoseEstimationComponent;
