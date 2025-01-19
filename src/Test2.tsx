import React, { useRef, useState } from "react";
import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
/**
 * createScriptProcessor版。手軽に扱えるが非推奨指定なのでいずれ使えなくなる。
 * メインスレッドで同期的に処理するらしい。
 */
export const Test2: React.FC = () => {
    const [isRecordingState, setIsRecordingState] = useState(false); // UI更新用のstate
    const isRecording = useRef(false); // 動作管理用のref
    const [transcription, setTranscription] = useState<string>("");
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    const startTranscription = async () => {
        isRecording.current = true;
        setIsRecordingState(true); // UIを更新
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);

        const audioCtx = new AudioContext();
        setAudioContext(audioCtx);

        const input = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);

        const transcribeClient = new TranscribeStreamingClient({
            region: "ap-northeast-1", // 適切なAWSリージョンを設定
            credentials: {
                accessKeyId: import.meta.env.VITE_AWS_ACCESSKEY_ID as string, // AWSアクセスキー
                secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESSKEY as string, // AWSシークレットキー
            },
        });

        // オーディオデータを送信する非同期イテレーターを生成
        const audioStream = async function* (): AsyncIterable<{ AudioEvent: { AudioChunk: Uint8Array } }> {
            const audioChunks: Float32Array[] = [];

            processor.onaudioprocess = (event) => {
                const audioData = event.inputBuffer.getChannelData(0);
                audioChunks.push(audioData);
            };

            input.connect(processor);
            processor.connect(audioCtx.destination);
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
                    console.log(results)
                    if (results!.length > 0 && !results![0].IsPartial) {
                        setTranscription((prev) => prev + " " + results![0].Alternatives![0].Transcript);
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
        if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop());
        }

        if (audioContext && audioContext.state !== "closed") {
            audioContext.close(); // AudioContextが閉じられていない場合のみclose()
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
        <div>
            <h1>createScriptProcessor</h1>
            <button onClick={() => (isRecording.current ? stopTranscription() : startTranscription())}>
                {isRecordingState ? "停止" : "開始"}
            </button>
            <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "10px", height: "200px", overflowY: "scroll" }}>
                <p>{transcription}</p>
            </div>
        </div>
    );
};
