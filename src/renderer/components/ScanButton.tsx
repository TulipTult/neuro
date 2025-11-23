import React, { useEffect, useRef, useState } from 'react';

interface ComponentResult {
  components?: { name: string; count: number | null }[];
  error?: string;
  rawText?: string;
}

interface Props {
  onComponentsFound?: (
    components: { name: string; count: number | null }[] | undefined,
  ) => void;
}

export const ScanButton: React.FC<Props> = ({ onComponentsFound }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ComponentResult | null>(null);

  const startScan = async () => {
    onComponentsFound?.([]); // clear previous overlays
    setResult(null);
    setBusy(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCountdown(2);
      }
    } catch (e) {
      setBusy(false);
      setResult({ error: 'Camera access denied' });
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => (c ? c - 1 : 0)), 1000);
      return () => clearTimeout(t);
    }
    // Capture frame
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        // Stop camera
        const tracks = (video.srcObject as MediaStream)?.getTracks() || [];
        tracks.forEach((t) => t.stop());
        video.srcObject = null;
        window.electron?.ipcRenderer.once('scan-image-result', (payload) => {
          setResult(payload as ComponentResult);
          onComponentsFound?.((payload as ComponentResult).components);
          setBusy(false);
        });
        window.electron?.ipcRenderer.sendMessage('scan-image', dataUrl);
      } else {
        setBusy(false);
        setResult({ error: 'Canvas context unavailable' });
      }
    }
  }, [countdown]);

  return (
    <div style={{ marginTop: 24, textAlign: 'center' }}>
      <button type="button" disabled={busy} onClick={startScan}>
        {busy
          ? countdown !== null && countdown > 0
            ? `Scanning in ${countdown}`
            : 'Processing...'
          : 'Scan'}
      </button>
      <video ref={videoRef} style={{ display: 'none' }} />
      {result?.error && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#ff8686' }}>
          {result.error}
        </div>
      )}
      {result?.components && result.components.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
          {result.components.map((c, i) => (
            <li
              key={`${c.name}-${i}`}
              style={{
                fontSize: 12,
                background: 'rgba(255,255,255,0.12)',
                padding: '4px 8px',
                borderRadius: 6,
                marginBottom: 4,
              }}
            >
              {c.name} — {c.count === null ? '?' : c.count}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ScanButton;
