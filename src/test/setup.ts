import '@testing-library/jest-dom'
import { vi } from 'vitest'

// AudioWorkletNodeのモッククラス
// AudioWorkletを使用した音声処理のテストに必要
class MockAudioWorkletNode {
  // 音声ノードの接続・切断をモック化
  connect = vi.fn()
  disconnect = vi.fn()
  // MessagePortインターフェースのモック化
  port = {
    postMessage: vi.fn(),      // メッセージ送信
    addEventListener: vi.fn(),  // イベントリスナーの追加
    removeEventListener: vi.fn() // イベントリスナーの削除
  }
}

// AudioContextのモッククラス
// Web Audio APIのテストに必要
class MockAudioContext {
  // AudioWorklet機能のモック化
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined) // WorkletProcessorの読み込みをシミュレート
  }

  // ScriptProcessorNodeの生成をモック化
  createScriptProcessor() {
    return {
      connect: vi.fn(),        // ノードの接続
      disconnect: vi.fn(),     // ノードの切断
      addEventListener: vi.fn() // イベントリスナーの追加
    }
  }

  // MediaStreamAudioSourceNodeの生成をモック化
  createMediaStreamSource() {
    return {
      connect: vi.fn() // ソースノードの接続
    }
  }
}

// グローバルオブジェクトにモックを注入
window.AudioContext = MockAudioContext as any;
window.AudioWorkletNode = MockAudioWorkletNode as any;