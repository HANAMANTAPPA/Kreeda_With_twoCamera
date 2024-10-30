import React, { useEffect, useRef } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

const DualCameraPoseEstimation = () => {
  const videoRef1 = useRef(null); // Video element for the first camera
  const videoRef2 = useRef(null); // Video element for the second camera
  const canvasRef1 = useRef(null); // Canvas for the first camera
  const canvasRef2 = useRef(null); // Canvas for the second camera
  const pose1 = useRef(null);
  const pose2 = useRef(null);

  useEffect(() => {
    // Set up MediaPipe Pose for both cameras
    pose1.current = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose1.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose2.current = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose2.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // Start video streams for both cameras
    startVideoStream(videoRef1.current, 'cameraId1'); // Replace with actual camera ID for first camera
    startVideoStream(videoRef2.current, 'cameraId2'); // Replace with actual camera ID for second camera

    // Set up pose estimation on both video elements
    setupPoseEstimation(pose1.current, videoRef1.current, canvasRef1.current);
    setupPoseEstimation(pose2.current, videoRef2.current, canvasRef2.current);
  }, []);

  const startVideoStream = async (videoElement, deviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      videoElement.srcObject = stream;
    } catch (error) {
      console.error(`Error accessing camera with ID ${deviceId}:`, error);
    }
  };

  const setupPoseEstimation = (poseEstimator, videoElement, canvasElement) => {
    poseEstimator.onResults((results) => {
      const canvasCtx = canvasElement.getContext('2d');
      drawPoseResults(results, canvasCtx);
    });

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await poseEstimator.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  };

  const drawPoseResults = (results, canvasCtx) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, 640, 480);
    canvasCtx.drawImage(results.image, 0, 0, 640, 480);
    if (results.poseLandmarks) {
      results.poseLandmarks.forEach((landmark) => {
        canvasCtx.beginPath();
        canvasCtx.arc(landmark.x * 640, landmark.y * 480, 5, 0, 2 * Math.PI);
        canvasCtx.fillStyle = 'red';
        canvasCtx.fill();
      });
    }
    canvasCtx.restore();
  };

  return (
    <div>
      <h3>Camera 1</h3>
      <video ref={videoRef1} width="640" height="480" autoPlay />
      <canvas ref={canvasRef1} width="640" height="480" />
      
      <h3>Camera 2</h3>
      <video ref={videoRef2} width="640" height="480" autoPlay />
      <canvas ref={canvasRef2} width="640" height="480" />
    </div>
  );
};

export default DualCameraPoseEstimation;
