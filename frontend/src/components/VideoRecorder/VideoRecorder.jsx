import { useState, useRef, useEffect } from 'react';
import './VideoRecorder.css';

const VideoRecorder = ({ techniqueId, techniqueName, techniqueStyle, onClose, onSuccess }) => {
    const [mode, setMode] = useState('select');
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setMode('record');
            setError(null);
        } catch (err) {
            setError('Unable to access camera. Please ensure you have granted camera permissions.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startRecording = () => {
        if (!streamRef.current) return;

        const options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'video/webm;codecs=vp8';
        }

        const mediaRecorder = new MediaRecorder(streamRef.current, options);
        mediaRecorderRef.current = mediaRecorder;

        const chunks = [];
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setRecordedChunks(chunks);
            setMode('preview');
            stopCamera();
        };

        mediaRecorder.start();
        setIsRecording(true);
        setError(null);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            setError('Please select a valid video file');
            return;
        }

        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('Video file is too large. Maximum size is 100MB');
            return;
        }

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setMode('preview');
        setError(null);
    };

    const handleUpload = async () => {
        if (!previewUrl) return;

        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const formData = new FormData();

            if (selectedFile) {
                formData.append('video', selectedFile);
            } else if (recordedChunks.length > 0) {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                formData.append('video', blob, 'recorded-technique.webm');
            }

            formData.append('technique_name', techniqueName);
            formData.append('style', techniqueStyle);
            formData.append('title', `${techniqueName} - ${new Date().toLocaleDateString()}`);
            formData.append('is_private', 'true');

            const token = localStorage.getItem('token');

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percentComplete);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 201) {
                    const response = JSON.parse(xhr.responseText);
                    if (onSuccess) {
                        onSuccess(response.video);
                    }
                } else {
                    const error = JSON.parse(xhr.responseText);
                    setError(error.message || 'Upload failed');
                    setUploading(false);
                }
            });

            xhr.addEventListener('error', () => {
                setError('Network error during upload');
                setUploading(false);
            });

            xhr.open('POST', 'http://localhost:5000/api/training/videos');
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.send(formData);

        } catch (err) {
            setError('Failed to upload video. Please try again.');
            setUploading(false);
        }
    };

    const handleReset = () => {
        setMode('select');
        setPreviewUrl(null);
        setSelectedFile(null);
        setRecordedChunks([]);
        setUploadProgress(0);
        setError(null);
        stopCamera();
    };

    return (
        <div className="video-recorder-overlay">
            <div className="video-recorder-modal">
                <div className="modal-header">
                    <h2>Record Your Technique</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div className="error-banner">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                <div className="modal-body">
                    {mode === 'select' && (
                        <div className="mode-select">
                            <h3>How would you like to add your video?</h3>
                            <div className="mode-buttons">
                                <button className="mode-btn record-btn" onClick={startCamera}>
                                    <div className="mode-icon">📹</div>
                                    <div className="mode-text">
                                        <strong>Record Video</strong>
                                        <span>Use your webcam to record</span>
                                    </div>
                                </button>

                                <label className="mode-btn upload-btn">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="mode-icon">📁</div>
                                    <div className="mode-text">
                                        <strong>Upload Video</strong>
                                        <span>Choose a file from your device</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {mode === 'record' && (
                        <div className="recording-view">
                            <div className="video-container">
                                <video ref={videoRef} autoPlay muted playsInline />
                                {isRecording && (
                                    <div className="recording-indicator">
                                        <span className="rec-dot"></span>
                                        REC
                                    </div>
                                )}
                            </div>

                            <div className="recording-controls">
                                {!isRecording ? (
                                    <button className="control-btn start-btn" onClick={startRecording}>
                                        <span className="btn-icon">⬤</span>
                                        Start Recording
                                    </button>
                                ) : (
                                    <button className="control-btn stop-btn" onClick={stopRecording}>
                                        <span className="btn-icon">⬛</span>
                                        Stop Recording
                                    </button>
                                )}

                                <button className="control-btn cancel-btn" onClick={handleReset}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'preview' && (
                        <div className="preview-view">
                            <div className="video-container">
                                <video src={previewUrl} controls playsInline />
                            </div>

                            <div className="preview-info">
                                <h3>Preview Your Video</h3>
                                <p className="technique-info">
                                    <strong>Technique:</strong> {techniqueName} ({techniqueStyle})
                                </p>
                                <p className="upload-note">
                                    Review your video before uploading. You can re-record if needed.
                                </p>
                            </div>

                            {uploading ? (
                                <div className="upload-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p>Uploading... {uploadProgress}%</p>
                                </div>
                            ) : (
                                <div className="preview-controls">
                                    <button className="control-btn upload-btn-primary" onClick={handleUpload}>
                                        <span className="btn-icon">⬆️</span>
                                        Upload Video
                                    </button>

                                    <button className="control-btn retake-btn" onClick={handleReset}>
                                        <span className="btn-icon">↻</span>
                                        {selectedFile ? 'Choose Different Video' : 'Re-record'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoRecorder;