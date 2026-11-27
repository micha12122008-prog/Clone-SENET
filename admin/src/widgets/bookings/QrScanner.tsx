import { useEffect, useRef, useState } from "react";

interface DetectedBarcode {
    rawValue: string;
}

interface BarcodeDetectorLike {
    detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

const SCAN_INTERVAL_MS = 400;

const getDetectorCtor = (): BarcodeDetectorCtor | undefined =>
    (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;

interface QrScannerProps {
    onDetect: (value: string) => void;
}

//Camera for check-in. Uses the browser-native BarcodeDetector (Chrome/Edge/Android), without any additional packages
//Where it is not available, there is a prompt to use a token or a phone
export function QrScanner({ onDetect }: QrScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const onDetectRef = useRef(onDetect);
    const [error, setError] = useState<string | null>(null);
    //Without BarcodeDetector or getUserMedia (for example, a page served over HTTP rather than from localhost), the camera is unavailable
    const Detector = navigator.mediaDevices?.getUserMedia ? getDetectorCtor() : undefined;

    useEffect(() => {
        onDetectRef.current = onDetect;
    });

    useEffect(() => {
        if (!Detector) return;

        let stream: MediaStream | null = null;
        let timer: number | undefined;
        let cancelled = false;
        const detector = new Detector({ formats: ["qr_code"] });

        const scan = async () => {
            const video = videoRef.current;
            if (cancelled || !video || video.readyState < 2) return;
            try {
                const [code] = await detector.detect(video);
                if (code?.rawValue && !cancelled) onDetectRef.current(code.rawValue);
            } catch {
                // frame not recognized 
            }
        };

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "environment" } })
            .then(async (media) => {
                if (cancelled) {
                    media.getTracks().forEach((track) => track.stop());
                    return;
                }
                stream = media;
                const video = videoRef.current;
                if (!video) return;
                video.srcObject = media;
                await video.play();
                timer = window.setInterval(() => void scan(), SCAN_INTERVAL_MS);
            })
            .catch(() => setError("Немає доступу до камери. Дозвольте її у браузері або введіть токен чи телефон."));

        return () => {
            cancelled = true;
            if (timer) window.clearInterval(timer);
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [Detector]);

    if (!Detector) {
        return (
            <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                Цей браузер не вміє читати QR. Скористайтеся токеном або телефоном (або Chrome/Edge).
            </p>
        );
    }

    return (
        <div className="flex max-w-md flex-col gap-2">
            {error ? (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </p>
            ) : (
                <video ref={videoRef} muted playsInline className="aspect-video w-full rounded-lg bg-black" />
            )}
        </div>
    );
}
