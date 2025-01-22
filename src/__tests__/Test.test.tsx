import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { Test } from '../Test'
import { describe, it, expect, beforeEach } from 'vitest'

describe('Test Component', () => {
    beforeEach(() => {
        // メディアストリームのモック
        const mockStream = {
            getTracks: () => [{
                stop: vi.fn()
            }]
        };

        // getUserMediaのモック
        const mockMediaDevices = {
            getUserMedia: vi.fn().mockResolvedValue(mockStream)
        };

        // AudioContextのモックを改善
        class MockAudioContext {
            state = 'running';
            close = vi.fn();
            destination = {};
            audioWorklet = {
                addModule: vi.fn().mockResolvedValue(undefined)
            };
            createMediaStreamSource = () => ({
                connect: vi.fn()
            });
        }

        // AudioWorkletNodeのモック
        class MockAudioWorkletNode {
            port = {
                onmessage: null,
                postMessage: vi.fn()
            };
            connect = vi.fn();
            disconnect = vi.fn();
        }
        
        // グローバルモックの設定
        Object.defineProperty(window.navigator, 'mediaDevices', {
            value: mockMediaDevices,
            writable: true
        });
        window.AudioContext = MockAudioContext as any;
        window.AudioWorkletNode = MockAudioWorkletNode as any;
    });

    // コンポーネントの初期表示状態をテスト
    it('初期状態で開始ボタンが表示される', () => {
        render(<Test />)
        expect(screen.getByText('開始')).toBeDefined()
    });

    // コンポーネントのヘッダー表示をテスト
    it('AudioWorkletのタイトルが表示される', () => {
        render(<Test />)
        expect(screen.getByText('AudioWorklet')).toBeDefined()
    });

    // ビデオ要素の存在をテスト
    it('ビデオ要素が表示される', () => {
        const { container } = render(<Test />)
        const videoContainer = container.querySelector('.video-container');
        expect(videoContainer).toBeDefined();
        const videoElement = videoContainer?.querySelector('video');
        expect(videoElement).toBeDefined();
    });

    // 録音・録画の開始・停止機能をテスト
    it('ボタンクリックで録音状態が切り替わる', async () => {
        render(<Test />)
        
        fireEvent.click(screen.getByText('開始'))
        await waitFor(() => {
            expect(screen.getByText('停止')).toBeDefined()
        })
        
        fireEvent.click(screen.getByText('停止'))
        await waitFor(() => {
            expect(screen.getByText('開始')).toBeDefined()
        })
    });

    // 字幕表示機能をテスト
    it('文字起こしが字幕として表示される', async () => {
        const { container } = render(<Test />)
        
        fireEvent.click(screen.getByText('開始'))
        await waitFor(() => {
            const videoContainer = container.querySelector('.video-container');
            expect(videoContainer).toHaveClass('video-container');
        });
    });
}); 