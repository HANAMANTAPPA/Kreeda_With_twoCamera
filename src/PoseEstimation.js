import React, {useRef, useEffect, useState} from 'react';
import {Pose} from '@mediapipe/pose';
import {Camera} from '@mediapipe/camera_utils';
import {drawConnectors, drawLandmarks} from '@mediapipe/drawing_utils';

const PoseEstimation = () => {
  const videoRefFront = useRef (null);
  const videoRefSide = useRef (null);
  const canvasRefFront = useRef (null);
  const canvasRefSide = useRef (null);

  const [devices, setDevices] = useState ([]);
  const [selectedFrontCamera, setSelectedFrontCamera] = useState (null);
  const [selectedSideCamera, setSelectedSideCamera] = useState (null);

  useEffect (() => {
    // Get available video input devices (cameras)
    navigator.mediaDevices.enumerateDevices ().then (deviceInfos => {
      const videoDevices = deviceInfos.filter (
        device => device.kind === 'videoinput'
      );
      setDevices (videoDevices); // Store available devices
    });
  }, []);

  const startCameraStream = async (deviceId, videoRef) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia ({
        video: {deviceId: {exact: deviceId}},
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play ();
    } catch (error) {
      console.error ('Error accessing camera:', error);
    }
  };

  useEffect (
    () => {
      if (selectedFrontCamera && selectedSideCamera) {
        // Pose estimator for front camera
        const poseFront = new Pose ({
          locateFile: file =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        poseFront.setOptions ({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseFront.onResults (results => {
          drawPoseResults (results, canvasRefFront);
        });

        // Pose estimator for side camera
        const poseSide = new Pose ({
          locateFile: file =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        poseSide.setOptions ({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseSide.onResults (results => {
          drawPoseResults (results, canvasRefSide);
        });

        // Start camera streams
        startCameraStream (selectedFrontCamera, videoRefFront);
        startCameraStream (selectedSideCamera, videoRefSide);

        // Set up Mediapipe camera streams
        if (videoRefFront.current) {
          const cameraFront = new Camera (videoRefFront.current, {
            onFrame: async () => {
              await poseFront.send ({image: videoRefFront.current});
            },
            width: 640,
            height: 480,
          });
          cameraFront.start ();
        }

        if (videoRefSide.current) {
          const cameraSide = new Camera (videoRefSide.current, {
            onFrame: async () => {
              await poseSide.send ({image: videoRefSide.current});
            },
            width: 640,
            height: 480,
          });
          cameraSide.start ();
        }
      }
    },
    [selectedFrontCamera, selectedSideCamera]
  );

  const drawPoseResults = (results, canvasRef) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext ('2d');
    canvasCtx.clearRect (0, 0, canvasElement.width, canvasElement.height);

    // Draw pose keypoints and connectors
    if (results.poseLandmarks) {
      drawConnectors (canvasCtx, results.poseLandmarks, Pose.POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4,
      });
      drawLandmarks (canvasCtx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
      });
    }
  };

  return (
    <div>
      <h2>Select Cameras</h2>
      <div>
        <label htmlFor="frontCamera">Front Camera:</label>
        <select
          id="frontCamera"
          onChange={e => setSelectedFrontCamera (e.target.value)}
        >
          <option value="">Select Front Camera</option>
          {devices.map (device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sideCamera">Side Camera:</label>
        <select
          id="sideCamera"
          onChange={e => setSelectedSideCamera (e.target.value)}
        >
          <option value="">Select Side Camera</option>
          {devices.map (device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${device.deviceId}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2>Front Camera Feed</h2>
        <video ref={videoRefFront} />
        <canvas ref={canvasRefFront} width="640" height="480" />
      </div>
      <div>
        <h2>Side Camera Feed</h2>
        <video ref={videoRefSide} />
        <canvas ref={canvasRefSide} width="640" height="480" />
      </div>
    </div>
  );
};

export default PoseEstimation;
