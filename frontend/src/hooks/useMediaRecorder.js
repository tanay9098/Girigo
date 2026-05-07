import { useState, useRef, useCallback } from "react";

/**
 * Custom hook wrapping MediaRecorder API.
 * Handles camera/mic access, recording, and returns final video Blob.
 */
export function useMediaRecorder() {
  const [state, setState]         = useState("idle"); // idle | requesting | ready | recording | stopped | error
  const [error, setError]         = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl]   = useState(null);  // local object URL for preview

  const streamRef   = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);

  // Request camera + microphone access
  const requestCamera = useCallback(async () => {
    setState("requesting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      setState("ready");
      return stream;
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera access and try again."
          : `Camera error: ${err.message}`
      );
      setState("error");
      return null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setVideoBlob(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);

    // Pick best supported format
    const mimeType = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ].find((m) => MediaRecorder.isTypeSupported(m)) || "";

    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      const url  = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      setState("stopped");
    };

    recorder.start(250); // collect chunks every 250ms
    setState("recording");
  }, [videoUrl]);

  // Stop recording
  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  // Re-record — clear previous recording and go back to ready state
  const reRecord = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setState("ready");
  }, [videoUrl]);

  // Stop camera stream entirely (cleanup)
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setState("idle");
  }, [videoUrl]);

  return {
    state,       // "idle" | "requesting" | "ready" | "recording" | "stopped" | "error"
    error,
    videoBlob,   // Blob — the recorded video, ready to encrypt and upload
    videoUrl,    // string — local object URL for <video> preview
    streamRef,   // ref to MediaStream — attach to <video> for live preview
    requestCamera,
    startRecording,
    stopRecording,
    reRecord,
    stopCamera,
  };
}