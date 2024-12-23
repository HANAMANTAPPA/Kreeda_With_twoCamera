import React, { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';

const DualCameraPoseEstimation = () => {
  const [cameras, setCameras] = useState([]);
  const [activeCamera, setActiveCamera] = useState(1);
  const [counter, setCounter] = useState(0);

  // States to track phase detection
  const [camera1Phase1, setCamera1Phase1] = useState(false);
  const [camera1Phase2, setCamera1Phase2] = useState(false);
  const [camera2Phase1, setCamera2Phase1] = useState(false);
  const [camera2Phase2, setCamera2Phase2] = useState(false);

  // State to prevent double-counting
  const [phaseComplete, setPhaseComplete] = useState(false);

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

  const setupPoseEstimation = (poseEstimator, videoElement, canvasElement, cameraNumber) => {
    poseEstimator.onResults(results => {
      const canvasCtx = canvasElement.getContext('2d');
      drawPoseResults(results, canvasCtx);

      if (results.poseLandmarks) {
        const landmarks = results.poseLandmarks;

        // Evaluate phases
        const phase1 = evaluate1(landmarks);
        const phase2 = evaluate2(landmarks);

        // Log phase detection for debugging
        console.log(`Camera ${cameraNumber}: Phase1=${phase1}, Phase2=${phase2}`);

        // Update state based on the camera
        if (cameraNumber === 1) {
          setCamera1Phase1(phase1);
          setCamera1Phase2(phase2);
        } else if (cameraNumber === 2) {
          setCamera2Phase1(phase1);
          setCamera2Phase2(phase2);
        }
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

  const calculateAngle = (pointA, pointB, pointC) => {
    const radians = Math.atan2(
      pointC.y - pointB.y, pointC.x - pointB.x
    ) - Math.atan2(
      pointA.y - pointB.y, pointA.x - pointB.x
    );
    let angle = Math.abs(radians * (180 / Math.PI));
    if (angle > 180) {
      angle = 360 - angle;
    }
    return angle;
  };

  const evaluate1 = att => {
    return (
      calculateAngle(att[12], att[14], att[16]) > 170 && // Right arm
      calculateAngle(att[11], att[13], att[15]) > 160    // Left arm
    );
  };

  const evaluate2 = att => {
    return (
      calculateAngle(att[12], att[14], att[16]) < 60 &&  // Right arm
      calculateAngle(att[11], att[13], att[15]) < 60     // Left arm
    );
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

      setupPoseEstimation(pose1.current, videoRef1.current, canvasRef1.current, 1);
      setupPoseEstimation(pose2.current, videoRef2.current, canvasRef2.current, 2);
    }
  }, [cameras]);

  // Watch for phase alignment and increment the counter
  useEffect(() => {
    if (
      !phaseComplete &&
      ((camera1Phase1 && camera2Phase1) || (camera1Phase2 && camera2Phase2))
    ) {
      setCounter(prevCounter => prevCounter + 1);
      setPhaseComplete(true); // Prevent double increment
      console.log('Counter incremented:', counter + 1);

      // Reset phase detection
      setTimeout(() => {
        setPhaseComplete(false);
        setCamera1Phase1(false);
        setCamera1Phase2(false);
        setCamera2Phase1(false);
        setCamera2Phase2(false);
      }, 1000); // 1-second cooldown
    }
  }, [camera1Phase1, camera1Phase2, camera2Phase1, camera2Phase2, phaseComplete]);

  return (
    <div>
      <h2>Dual Camera Pose Estimation</h2>
      <p>Counter: {Math.floor(counter / 2)}</p>
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
