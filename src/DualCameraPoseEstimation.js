import React, {useEffect, useRef, useState} from 'react';
import {Pose} from '@mediapipe/pose';
import {Camera} from '@mediapipe/camera_utils';

const DualCameraPoseEstimation = () => {
  const [cameras, setCameras] = useState ([]);
  const videoRef1 = useRef (null); // Video element for Camera 1
  const videoRef2 = useRef (null); // Video element for Camera 2
  const canvasRef1 = useRef (null); // Canvas for Camera 1
  const canvasRef2 = useRef (null); // Canvas for Camera 2
  const pose1 = useRef (null);
  const pose2 = useRef (null);

  useEffect (() => {
    // Enumerate video input devices (cameras)
    async function getCameras () {
      const devices = await navigator.mediaDevices.enumerateDevices ();
      const videoDevices = devices.filter (
        device => device.kind === 'videoinput'
      );
      setCameras (videoDevices);
      console.log (cameras);
    }
    getCameras ();
  }, []);

  const startVideoStream = async (videoElement, deviceId) => {
    const stream = await navigator.mediaDevices.getUserMedia ({
      video: {deviceId: {exact: deviceId}},
    });
    videoElement.srcObject = stream;
  };

  const setupPoseEstimation = (poseEstimator, videoElement, canvasElement) => {
    poseEstimator.onResults (results => {
      const canvasCtx = canvasElement.getContext ('2d');
      drawPoseResults (results, canvasCtx);
    });

    const camera = new Camera (videoElement, {
      onFrame: async () => {
        await poseEstimator.send ({image: videoElement});
      },
      width: 640,
      height: 480,
    });
    camera.start ();
  };

  const drawPoseResults = (results, canvasCtx) => {
    canvasCtx.save ();
    canvasCtx.clearRect (0, 0, 640, 480);
    canvasCtx.drawImage (results.image, 0, 0, 640, 480);
    if (results.poseLandmarks) {
      results.poseLandmarks.forEach (landmark => {
        canvasCtx.beginPath ();
        canvasCtx.arc (landmark.x * 640, landmark.y * 480, 5, 0, 2 * Math.PI);
        canvasCtx.fillStyle = 'red';
        canvasCtx.fill ();
      });
    }
    canvasCtx.restore ();
  };

  useEffect (
    () => {
      // Set up MediaPipe Pose for both cameras
      if (cameras.length >= 2) {
        console.log (cameras);

        pose1.current = new Pose ({
          locateFile: file =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose1.current.setOptions ({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose2.current = new Pose ({
          locateFile: file =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose2.current.setOptions ({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // Start video streams for both cameras
        startVideoStream (videoRef1.current, cameras[0].deviceId);
        startVideoStream (videoRef2.current, cameras[1].deviceId);

        // Set up pose estimation on both video elements
        // setupPoseEstimation(pose1.current, videoRef1.current, canvasRef1.current);
        setupPoseEstimation (
          pose2.current,
          videoRef2.current,
          canvasRef2.current
        );
      }
    },
    [cameras]
  );

  return (
    <div style={{display: 'flex'}}>
      <div>
        <h3>Camera 1</h3>
        <video ref={videoRef1} width="640" height="480" autoPlay />
        <canvas ref={canvasRef1} width="640" height="480" />
      </div>
      <div>
        <h3>Camera 2</h3>
        <video ref={videoRef2} width="640" height="480" autoPlay />
        <canvas ref={canvasRef2} width="640" height="480" />
      </div>
    </div>
  );
};

export default DualCameraPoseEstimation;
