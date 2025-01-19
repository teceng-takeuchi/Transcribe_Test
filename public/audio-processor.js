class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
      super();
      this.audioBuffer = [];
  }

  process(inputs) {
      const inputChannel = inputs[0][0]; // 最初の入力チャネル
      if (inputChannel) {
          this.audioBuffer.push(...inputChannel); // データをバッファに蓄積
      }

      if (this.audioBuffer.length >= 4096) { // 一定量バッファがたまったら送信
          this.port.postMessage(this.audioBuffer.slice(0, 4096)); // 4096サンプル分を送信
          this.audioBuffer = this.audioBuffer.slice(4096); // 残りを保持
      }
      return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);