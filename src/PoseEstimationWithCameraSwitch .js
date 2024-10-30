import React, { useEffect, useRef, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

const PoseEstimationWithCameraSwitch = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const pose = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => {
    pose.current = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.current.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const fetchDevices = async () => {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceInfos.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    };
    fetchDevices();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (selectedDeviceId) {
      startVideoStream(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const startVideoStream = async (deviceId) => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      videoRef.current.srcObject = stream;
      setCameraStream(stream);

      videoRef.current.onloadedmetadata = () => {
        setupPoseEstimation(pose.current, videoRef.current, canvasRef.current);
      };
      videoRef.current.play(); // Ensure the video starts playing
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
        // Ensure video is ready
        if (videoElement.readyState >= 2) {
          await poseEstimator.send({ image: videoElement });
        }
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
      <h3>Pose Estimation</h3>
      <select 
        value={selectedDeviceId} 
        onChange={(e) => setSelectedDeviceId(e.target.value)}>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${devices.indexOf(device) + 1}`}
          </option>
        ))}
      </select>
      <video ref={videoRef} width="640" height="480" autoPlay />
      <canvas ref={canvasRef} width="640" height="480" />
    </div>
  );
};

export default PoseEstimationWithCameraSwitch;
