import { render, screen, fireEvent } from '@testing-library/react'
import { Test2 } from '../Test2'
import { describe, it, expect, vi } from 'vitest'

describe('Test2 Component', () => {
  // コンポーネントの初期表示状態をテスト
  it('初期状態で開始ボタンが表示される', () => {
    render(<Test2 />)
    // 開始ボタンが存在することを確認
    expect(screen.getByText('開始')).toBeDefined()
  })

  // コンポーネントのヘッダー表示をテスト
  it('createScriptProcessorのタイトルが表示される', () => {
    render(<Test2 />)
    // createScriptProcessorというタイトルが存在することを確認
    expect(screen.getByText('createScriptProcessor')).toBeDefined()
  })

  // 録音の開始・停止機能をテスト
  it('ボタンクリックで録音状態が切り替わる', async () => {
    // getUserMediaのモックを作成
    // AudioWorklet版と同様にダミーのメディアストリームを返す
    const mockMediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{
          stop: vi.fn() // stopメソッドもモック化
        }]
      })
    }
    // windowのmediaDevicesをモックに置き換え
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: mockMediaDevices,
      writable: true
    })

    render(<Test2 />)
    const button = screen.getByText('開始')
    
    // 開始ボタンをクリックして録音開始
    fireEvent.click(button)
    // ボタンのテキストが「停止」に変わることを確認
    expect(screen.getByText('停止')).toBeDefined()
    
    // 停止ボタンをクリックして録音停止
    fireEvent.click(screen.getByText('停止'))
    // ボタンのテキストが「開始」に戻ることを確認
    expect(screen.getByText('開始')).toBeDefined()
  })
}) 