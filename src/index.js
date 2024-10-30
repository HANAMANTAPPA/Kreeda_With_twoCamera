import React from 'react';
import ReactDOM from 'react-dom/client';
// import PoseEstimation from './PoseEstimation';
// import PoseEstimation1 from './PoseEstimation1';
import DualCameraPoseEstimation from './DualCameraPoseEstimation';
import DualCameraPoseEstimation2 from './DualCameraPoseEstimation2'; 
import PoseEstimationWithCameraSwitch from './PoseEstimationWithCameraSwitch ';
import Example from './Example';
import PoseEstimationComponent from './PoseEstimationComponent';
// import PoseestimationForSingleCamera from './PoseestimationForSingleCamera';

const root = ReactDOM.createRoot (document.getElementById ('root'));
root.render(
  <>
    
    {/* <PoseEstimation /> */}
    {/* <PoseEstimation1 />   */}
    {/* < DualCameraPoseEstimation2 /> */}
    {/* <PoseestimationForSingleCamera /> */}
    {/* <PoseEstimationWithCameraSwitch /> */}
    <DualCameraPoseEstimation />
    {/* < Example /> */}
    {/* < PoseEstimationComponent /> */}
  
  
  
  </>
    
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
