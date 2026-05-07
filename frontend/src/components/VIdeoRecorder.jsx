import { useRef, useEffect } from "react";
import { useMediaRecorder } from "../hooks/useMediaRecorder.js";

/**
 * Video recorder component.
 * Shows live camera preview → record → stop → preview → confirm or re-record.
 *
 * @param {function} onVideoReady  called with the final Blob when user confirms
 */
export default function VideoRecorder({ onVideoReady }) {
  const liveVideoRef    = useRef(null); // for live camera feed
  const previewVideoRef = useRef(null); // for recorded playback

  const {
    state, error, videoBlob, videoUrl, streamRef,
    requestCamera, startRecording, stopRecording, reRecord, stopCamera,
  } = useMediaRecorder();

  // Attach live stream to video element
  useEffect(() => {
    if (liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
    }
  }, [state, streamRef]);

  // Cleanup camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  function handleConfirm() {
    if (videoBlob) {
      stopCamera();
      onVideoReady(videoBlob);
    }
  }

  return (
    <div className="video-recorder">

      {/* ── IDLE: start button ──────────────────────────────────────── */}
      {state === "idle" && (
        <div className="recorder-idle">
          <div className="recorder-icon">🎥</div>
          <p>Your wish will be recorded as a video.<br />It will be encrypted before leaving your device.</p>
          <button className="btn-primary" onClick={requestCamera}>
            Open camera
          </button>
        </div>
      )}

      {/* ── REQUESTING: waiting for permission ─────────────────────── */}
      {state === "requesting" && (
        <div className="recorder-idle">
          <div className="recorder-icon">📷</div>
          <p className="recorder-hint">Waiting for camera permission···</p>
        </div>
      )}

      {/* ── ERROR ───────────────────────────────────────────────────── */}
      {state === "error" && (
        <div className="recorder-idle">
          <div className="form-error">{error}</div>
          <button className="btn-secondary" onClick={requestCamera} style={{ marginTop: "1rem" }}>
            Try again
          </button>
        </div>
      )}

      {/* ── READY / RECORDING: live camera feed ─────────────────────── */}
      {(state === "ready" || state === "recording") && (
        <div className="recorder-live">
          <div className="live-preview-wrap">
            <video
              ref={liveVideoRef}
              autoPlay
              muted
              playsInline
              className="live-preview"
            />
            {state === "recording" && (
              <div className="rec-indicator">
                <span className="rec-dot" />REC
              </div>
            )}
          </div>

          <div className="recorder-controls">
            {state === "ready" && (
              <button className="btn-record" onClick={startRecording}>
                ⏺ Start recording
              </button>
            )}
            {state === "recording" && (
              <button className="btn-stop" onClick={stopRecording}>
                ⏹ Stop
              </button>
            )}
          </div>

          <p className="recorder-hint">
            Speak your wish clearly. Max recommended: 2 minutes.
          </p>
        </div>
      )}

      {/* ── STOPPED: playback + confirm ─────────────────────────────── */}
      {state === "stopped" && videoUrl && (
        <div className="recorder-preview">
          <p className="recorder-hint">Review your wish before submitting:</p>

          <video
            ref={previewVideoRef}
            src={videoUrl}
            controls
            playsInline
            className="recorded-preview"
          />

          <div className="recorder-preview-actions">
            <button className="btn-secondary" onClick={reRecord}>
              ↩ Re-record
            </button>
            <button className="btn-primary" onClick={handleConfirm}>
              ✓ Use this recording
            </button>
          </div>
        </div>
      )}
    </div>
  );
}