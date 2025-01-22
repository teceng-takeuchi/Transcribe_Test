import React, { useRef, useState } from "react";
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import './Test.css';

/**
 * AudioWorklet版。色々めんどくさいが今後の標準仕様。
 * 非同期で処理するらしい。
 * 参考: https://qiita.com/ryoyakawai/items/1160586653330ccbf4a4
 */
export const Test: React.FC = () => {
    const [isRecordingState, setIsRecordingState] = useState(false);
    const isRecording = useRef(false);
    const [transcription, setTranscription] = useState<string>("");
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    // 字幕のスタイル設定
    const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
    

    const startTranscription = async () => {
        // 既存のAudioContextをクリーンアップ
        if (audioContext && audioContext.state !== 'closed') {
            await audioContext.close();
        }
        isRecording.current = true;
        setIsRecordingState(true);

        // オーディオとビデオの両方を取得
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true,
            video: true 
        });
        setMediaStream(stream);

        // ビデオ要素にストリームを設定
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }

        // 新しいAudioContextを作成
        const newAudioContext = new AudioContext();
        setAudioContext(newAudioContext);

        // AudioWorkletモジュールをロード
        await newAudioContext.audioWorklet.addModule("/audio-processor.js");

        const input = newAudioContext.createMediaStreamSource(stream);
        const processor = new AudioWorkletNode(newAudioContext, "audio-processor");

        const transcribeClient = new TranscribeStreamingClient({
            region: "ap-northeast-1", // 適切なAWSリージョンを設定
            credentials: {
                accessKeyId: import.meta.env.VITE_AWS_ACCESSKEY_ID as string, // AWSアクセスキー
                secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESSKEY as string, // AWSシークレットキー
            },
        });

        const audioStream = async function* (): AsyncIterable<{ AudioEvent: { AudioChunk: Uint8Array } }> {
            const audioChunks: Float32Array[] = [];
            processor.port.onmessage = (event) => {
                const audioData = event.data;
                audioChunks.push(audioData);
            };

            input.connect(processor);
            processor.connect(newAudioContext.destination);

            while (isRecording.current) {
                if (audioChunks.length > 0) {
                    const chunk = audioChunks.shift()!;
                    const int16Array = float32ToInt16(chunk);
                    yield { AudioEvent: { AudioChunk: new Uint8Array(int16Array.buffer) } };
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        };
        const command = new StartStreamTranscriptionCommand({
            LanguageCode: "ja-JP", // 言語コードを設定
            MediaSampleRateHertz: 44100,
            MediaEncoding: "pcm",
            AudioStream: audioStream(),
        });

        try {
            const response = await transcribeClient.send(command);
            for await (const event of response.TranscriptResultStream!) {
                if (event.TranscriptEvent) {
                    const results = event.TranscriptEvent.Transcript!.Results;
                    if (results!.length > 0) {
                        const transcript = results![0].Alternatives![0].Transcript;
                        if (!results![0].IsPartial) {
                            // 確定した文字起こしを全体の文字起こしに追加
                            setTranscription((prev) => prev + " " + transcript);
                        }
                        // 部分的な文字起こしも含めて字幕として表示
                        setCurrentSubtitle(transcript ?? "");
                    }
                }
            }
        } catch (error) {
            console.error("Transcription error:", error);
        }
    };

    const stopTranscription = () => {
        isRecording.current = false;
        setIsRecordingState(false); // UIを更新
        setCurrentSubtitle(""); // 字幕をクリア
        setTranscription(""); // 文字起こし履歴をクリア
        
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
        }

        // AudioContextのクローズ処理を修正
        if (audioContext && audioContext.state !== 'closed') {
            audioContext.close();
        }

        // ビデオストリームをクリア
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const float32ToInt16 = (float32Array: Float32Array): Int16Array => {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            int16Array[i] = Math.min(1, float32Array[i]) * 0x7fff;
        }
        return int16Array;
    };

    return (
        <div className="test-container">
            <h1>AudioWorklet</h1>
            <button onClick={() => (isRecording.current ? stopTranscription() : startTranscription())}>
                {isRecordingState ? "停止" : "開始"}
            </button>
            
            {/* ビデオと字幕を表示するコンテナ */}
            <div className="video-container">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="video-element"
                />
                {/* 字幕オーバーレイ */}
                {currentSubtitle && (
                    <div className="subtitle-overlay">
                        {currentSubtitle}
                    </div>
                )}
            </div>

            {/* 文字起こし履歴 */}
            <div className="transcription-history">
                <p>{transcription}</p>
            </div>
        </div>
    );
};
