import { useState } from 'react';
import './App.css'
import { Test } from './Test'
import { Test2 } from './Test2'

function App() {
  const [password, setPassword] = useState('');
  const passPhrase = import.meta.env.VITE_PASSWORD;

  return (
    <>
      <h1>リアルタイム音声文字起こし</h1>
      {password !== passPhrase ? (
        // パスワード入力フォーム
        <div className="password-form">
          <input
            type="password"
            placeholder="パスワードを入力してください"
            aria-label="パスワード入力"
            onChange={(e) => {
              setPassword(e.target.value)
            }}
            value={password}
          />
        </div>
      ) : (
        // 認証後のコンポーネント
        <>
          <Test />
          <Test2 />
        </>
      )}
    </>
  )
}

export default App
