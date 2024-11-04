import React, { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';

const DualCameraPoseEstimation = () => {
  const [cameras, setCameras] = useState([]);
  const [activeCamera, setActiveCamera] = useState(1); // 1 for Camera 1, 2 for Camera 2
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);
  const pose1 = useRef(null);
  const pose2 = useRef(null);

  useEffect(() => {
    async function getCameras() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
    }
    getCameras();
  }, []);

  const startVideoStream = async (videoElement, deviceId) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
    });
    videoElement.srcObject = stream;
    await videoElement.play();
  };

  const setupPoseEstimation = (poseEstimator, videoElement, canvasElement, cameraLabel) => {
    poseEstimator.onResults(results => {
      const canvasCtx = canvasElement.getContext('2d');
      drawPoseResults(results, canvasCtx);

      if (results.poseLandmarks) {
        console.log(`Pose landmarks from ${cameraLabel}:`, results.poseLandmarks);
      }
    });

    const processVideoFrame = async () => {
      if (videoElement.readyState === 4) {
        await poseEstimator.send({ image: videoElement });
      }
      requestAnimationFrame(processVideoFrame);
    };
    processVideoFrame();
  };

  const drawPoseResults = (results, canvasCtx) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, 640, 480);
    canvasCtx.drawImage(results.image, 0, 0, 640, 480);

    if (results.poseLandmarks) {
      results.poseLandmarks.forEach(landmark => {
        canvasCtx.beginPath();
        canvasCtx.arc(landmark.x * 640, landmark.y * 480, 5, 0, 2 * Math.PI);
        canvasCtx.fillStyle = 'red';
        canvasCtx.fill();
      });
    }
    canvasCtx.restore();
  };

  useEffect(() => {
    if (cameras.length >= 2) {
      pose1.current = new Pose({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose1.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose2.current = new Pose({
        locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      pose2.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      startVideoStream(videoRef1.current, cameras[0].deviceId);
      startVideoStream(videoRef2.current, cameras[1].deviceId);

      setupPoseEstimation(pose1.current, videoRef1.current, canvasRef1.current, 'Camera 1');
      setupPoseEstimation(pose2.current, videoRef2.current, canvasRef2.current, 'Camera 2');
    }
  }, [cameras]);

  return (
    <div>
      <button onClick={() => setActiveCamera(1)}>Show Camera 1</button>
      <button onClick={() => setActiveCamera(2)}>Show Camera 2</button>
      <div style={{ display: 'flex' }}>
        <div style={{ display: activeCamera === 1 ? 'block' : 'none' }}>
          <h3>Camera 1</h3>
          <video ref={videoRef1} width="640" height="480" style={{ display: 'none' }} />
          <canvas ref={canvasRef1} width="640" height="480" />
        </div>
        <div style={{ display: activeCamera === 2 ? 'block' : 'none' }}>
          <h3>Camera 2</h3>
          <video ref={videoRef2} width="640" height="480" style={{ display: 'none' }} />
          <canvas ref={canvasRef2} width="640" height="480" />
        </div>
      </div>
    </div>
  );
};

export default DualCameraPoseEstimation;
