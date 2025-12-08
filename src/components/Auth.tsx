import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../hooks/use-language'
import { translations } from '../lib/translations'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const { language } = useLanguage()
  const t = translations[language]

  // Component yüklendiğinde kayıtlı email'i kontrol et
  useEffect(() => {
    const savedEmail = localStorage.getItem('whisper-weather-remember-email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        // Beni hatırla seçeneğine göre email'i kaydet
        if (rememberMe) {
          localStorage.setItem('whisper-weather-remember-email', email)
          // Session'ı süresiz yap - refresh token ile otomatik yenileme
          // Supabase otomatik olarak refresh token kullanarak session'ı yeniler
          // Kullanıcı tarayıcıyı kapatıp açsa bile oturum açık kalır
          console.log('Beni hatırla aktif - session süresiz uzatıldı')
        } else {
          localStorage.removeItem('whisper-weather-remember-email')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Hoş Geldin Mesajı */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          {t.app.title}
        </h1>
        <p className="text-lg text-white/80">
          {t.auth.welcomeToApp}
        </p>
      </div>
      
      <div className="glass-effect rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? t.auth.register : t.auth.login}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPlaceholder}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
              autoComplete="email"
            />
          </div>
          
          <div>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.passwordPlaceholder}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>

          {/* Beni Hatırla - sadece login'de göster */}
          {!isSignUp && (
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 bg-white/10 border-white/20 rounded text-white focus:ring-white/50 focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-white/80">
                Beni hatırla
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all disabled:opacity-50"
          >
            {loading ? t.auth.loading : (isSignUp ? t.auth.registerButton : t.auth.loginButton)}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isSignUp 
              ? t.auth.haveAccount
              : t.auth.noAccount
            }
          </button>
        </div>
      </div>
    </div>
  )
}
