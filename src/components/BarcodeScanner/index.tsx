import { useEffect, useRef, useState } from "react";
import { Modal } from "../ui/Modal";
import Button from "../ui/Button";

type ScanState =
  | "idle"
  | "camera-loading"
  | "camera-ready"
  | "processing"
  | "error";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (isbn: string) => void;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScanSuccess,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );

  // カメラストリームの初期化
  const startCamera = async () => {
    try {
      setState("camera-loading");
      setError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setState("camera-ready");
      }
    } catch (err) {
      console.error("カメラアクセスエラー:", err);
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError(
            "カメラへのアクセスが拒否されました。ブラウザの設定でカメラの使用を許可してください。",
          );
        } else if (err.name === "NotFoundError") {
          setError(
            "カメラデバイスが見つかりませんでした。カメラが接続されているか確認してください。",
          );
        } else if (err.name === "NotReadableError") {
          setError(
            "カメラが他のアプリケーションで使用中です。他のアプリケーションを閉じてから再度お試しください。",
          );
        } else {
          setError(`カメラエラー: ${err.message}`);
        }
      } else {
        setError("カメラの起動に失敗しました。");
      }
      setState("error");
    }
  };

  // カメラストリームのクリーンアップ
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState("idle");
  };

  // カメラの切り替え(モバイル対応)
  const switchCamera = async () => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // 画像をキャプチャしてバーコードスキャン
  const captureAndScan = async () => {
    if (!videoRef.current || state !== "camera-ready") return;

    try {
      setState("processing");
      setError("");

      const video = videoRef.current;

      // ソースCanvasにビデオをキャプチャ
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = video.videoWidth;
      sourceCanvas.height = video.videoHeight;

      const sourceCtx = sourceCanvas.getContext("2d");
      if (!sourceCtx) {
        throw new Error("Canvas context の取得に失敗しました");
      }

      sourceCtx.drawImage(video, 0, 0);

      // Base64エンコード (JPEG, 高品質)
      const base64Image = sourceCanvas
        .toDataURL("image/jpeg", 0.95)
        .split(",")[1];

      // バックエンドでバーコード認識
      // デバッグモード: Shift+クリックでデバッグ画像を保存
      const isDebugMode = (window.event as MouseEvent)?.shiftKey || false;
      const { invoke } = await import("@tauri-apps/api/core");
      const isbn = await invoke<string>("scan_barcode", {
        imageData: base64Image,
        saveDebugImages: isDebugMode,
      });

      if (isDebugMode) {
        console.log(
          "デバッグモード: 画像を保存しました (ホームディレクトリ/barcode_debug/)",
        );
      }

      // 認識成功
      onScanSuccess(isbn);
      stopCamera();
      onClose();
    } catch (err) {
      console.error("スキャンエラー:", err);
      setError(
        typeof err === "string"
          ? err
          : "バーコードの認識に失敗しました。もう一度お試しください。",
      );
      setState("camera-ready"); // 再撮影可能な状態に戻す
    }
  };

  // モーダルが開いたらカメラ起動、閉じたら停止
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-black text-black mb-4">
          📷 バーコードスキャン
        </h2>
        <div className="flex flex-col gap-4">
          {/* カメラプレビュー */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* スキャンガイドライン */}
            {state === "camera-ready" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-green-400 rounded-lg w-4/5 h-2/3 shadow-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                </div>
              </div>
            )}

            {/* ローディング表示 */}
            {state === "camera-loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-lg">カメラを起動中...</div>
              </div>
            )}

            {/* 処理中表示 */}
            {state === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  <div className="text-white text-lg">スキャン中...</div>
                </div>
              </div>
            )}
          </div>

          {/* エラー表示 */}
          {state === "error" && error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">エラー</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* 処理失敗時のエラー表示(カメラは起動中) */}
          {state === "camera-ready" && error && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* 操作ボタン */}
          <div className="flex gap-2">
            <Button
              onClick={captureAndScan}
              disabled={state !== "camera-ready"}
              className="flex-1"
            >
              {state === "processing" ? "処理中..." : "スキャン"}
            </Button>

            <Button
              onClick={switchCamera}
              disabled={state === "processing"}
              variant="secondary"
            >
              📷 切替
            </Button>

            {state === "error" && (
              <Button onClick={startCamera} variant="secondary">
                再試行
              </Button>
            )}

            <Button onClick={onClose} variant="secondary">
              閉じる
            </Button>
          </div>

          {/* 使い方のヒント */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-1">💡 使い方のヒント</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>バーコード全体が緑色の枠内に収まるようにしてください</li>
              <li>明るい場所で、影がかからないようにしてください</li>
              <li>カメラをバーコードに対して平行に保ってください</li>
              <li>
                「📷 切替」ボタンでフロント/バックカメラを切り替えられます
              </li>
              <li className="text-blue-600 font-semibold">
                🔍 デバッグ: Shiftキー+スキャンボタンで画像を保存できます
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
