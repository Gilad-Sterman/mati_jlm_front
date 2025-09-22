// import React from 'react';
// import { useTranslation } from 'react-i18next';
// import { FileAudio, Upload } from 'lucide-react';

// export function UploadingLoader({ fileName, progress, message }) {
//   const { t } = useTranslation();

//   return (
//     <div className="uploading-loader">
//       <div className="loader-content">
//         {/* File Icon */}
//         <div className="file-icon-container">
//           <FileAudio className="file-icon" />
//           <div className="upload-animation">
//             <Upload className="upload-icon" />
//           </div>
//         </div>

//         {/* File Info */}
//         <div className="upload-info">
//           <h3>{t('upload.uploadingFile')}</h3>
//           <p className="file-name">{fileName}</p>
//           <p className="upload-message">{message}</p>
//         </div>

//         {/* Progress Bar */}
//         <div className="progress-container">
//           <div className="progress-bar">
//             <div 
//               className="progress-fill uploading" 
//               style={{ width: `${progress}%` }}
//             ></div>
//           </div>
//           <span className="progress-text">{progress}%</span>
//         </div>

//         {/* Loading Dots */}
//         <div className="loading-dots">
//           <span></span>
//           <span></span>
//           <span></span>
//         </div>
//       </div>
//     </div>
//   );
// }
