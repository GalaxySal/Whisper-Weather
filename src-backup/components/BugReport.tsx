import { useState } from 'react'
import { Bug, Send, AlertCircle, CheckCircle, Clock, Mail, Tag } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { MotionItem } from '@/components/ui/motion'
import { toast } from 'sonner'

export default function BugReport() {
  const { language } = useLanguage()
  const [formData, setFormData] = useState({
    email: '',
    bugType: 'general',
    severity: 'medium',
    title: '',
    description: '',
    steps: '',
    expected: '',
    actual: '',
    environment: '',
    browser: '',
    device: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasyon
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error(
        language === 'tr' ? 'Lütfen başlık ve açıklama alanlarını doldurun' : 'Please fill in title and description fields'
      )
      return
    }

    setIsSubmitting(true)

    try {
      // Simüle edilmiş gönderim (gerçek uygulamada API'ye gönderilir)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSubmitted(true)
      toast.success(
        language === 'tr' ? 'Hata bildiriminiz başarıyla gönderildi!' : 'Bug report submitted successfully!'
      )
      
      // Form'u sıfırla
      setFormData({
        email: '',
        bugType: 'general',
        severity: 'medium',
        title: '',
        description: '',
        steps: '',
        expected: '',
        actual: '',
        environment: '',
        browser: '',
        device: ''
      })
    } catch (error) {
      toast.error(
        language === 'tr' ? 'Gönderim sırasında hata oluştu' : 'Error occurred during submission'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const bugTypes = [
    { value: 'general', label: language === 'tr' ? 'Genel Hata' : 'General Bug' },
    { value: 'ui', label: language === 'tr' ? 'Arayüz Hatası' : 'UI Bug' },
    { value: 'performance', label: language === 'tr' ? 'Performans' : 'Performance' },
    { value: 'security', label: language === 'tr' ? 'Güvenlik' : 'Security' },
    { value: 'feature', label: language === 'tr' ? 'Özellik İsteği' : 'Feature Request' }
  ]

  const severityLevels = [
    { value: 'low', label: language === 'tr' ? 'Düşük' : 'Low', color: 'text-green-600' },
    { value: 'medium', label: language === 'tr' ? 'Orta' : 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: language === 'tr' ? 'Yüksek' : 'High', color: 'text-orange-600' },
    { value: 'critical', label: language === 'tr' ? 'Kritik' : 'Critical', color: 'text-red-600' }
  ]

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto">
        <MotionItem delay={0.1}>
          <div className="glass-effect rounded-2xl p-8 text-white text-center">
            <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {language === 'tr' ? 'Bildiriminiz Alındı!' : 'Report Received!'}
            </h2>
            <p className="text-white/80 mb-6">
              {language === 'tr' 
                ? 'Hata bildiriminiz başarıyla gönderildi. En kısa sürede incelenecektir.'
                : 'Your bug report has been submitted successfully. It will be reviewed shortly.'
              }
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white hover:bg-white/30 transition-all duration-200"
            >
              {language === 'tr' ? 'Yeni Bildirim' : 'New Report'}
            </button>
          </div>
        </MotionItem>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <MotionItem delay={0.1}>
        <div className="glass-effect rounded-2xl p-8 text-white">
          <div className="flex items-center mb-6">
            <Bug className="w-8 h-8 mr-3 text-red-400" />
            <h1 className="text-3xl font-bold">
              {language === 'tr' ? 'Hata Bildirimi' : 'Bug Report'}
            </h1>
          </div>

          <p className="text-white/80 mb-8">
            {language === 'tr' 
              ? 'Uygulamadaki hataları bildirmek için aşağıdaki formu doldurun. Detaylı bilgi, sorunların daha hızlı çözülmesine yardımcı olur.'
              : 'Fill out the form below to report bugs in the application. Detailed information helps resolve issues faster.'
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* İletişim Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'E-posta (İsteğe Bağlı)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'ornek@email.com' : 'example@email.com'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  {language === 'tr' ? 'Hata Türü' : 'Bug Type'}
                </label>
                <select
                  value={formData.bugType}
                  onChange={(e) => handleInputChange('bugType', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {bugTypes.map(type => (
                    <option key={type.value} value={type.value} className="bg-gray-800">
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Önem Seviyesi */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'tr' ? 'Önem Seviyesi' : 'Severity Level'}
              </label>
              <div className="flex flex-wrap gap-3">
                {severityLevels.map(level => (
                  <label key={level.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="severity"
                      value={level.value}
                      checked={formData.severity === level.value}
                      onChange={(e) => handleInputChange('severity', e.target.value)}
                      className="mr-2"
                    />
                    <span className={`text-sm ${level.color}`}>{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Başlık ve Açıklama */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'tr' ? 'Hata Başlığı' : 'Bug Title'} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={language === 'tr' ? 'Hatanın kısa açıklaması' : 'Brief description of the bug'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'tr' ? 'Detaylı Açıklama' : 'Detailed Description'} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={language === 'tr' ? 'Hata hakkında detaylı bilgi' : 'Detailed information about the bug'}
                required
              />
            </div>

            {/* Tekrarlama Adımları */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {language === 'tr' ? 'Tekrarlama Adımları' : 'Steps to Reproduce'}
              </label>
              <textarea
                value={formData.steps}
                onChange={(e) => handleInputChange('steps', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={language === 'tr' ? '1. ...\n2. ...\n3. ...' : '1. ...\n2. ...\n3. ...'}
              />
            </div>

            {/* Beklenen ve Gerçekleşen Sonuç */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'tr' ? 'Beklenen Sonuç' : 'Expected Result'}
                </label>
                <textarea
                  value={formData.expected}
                  onChange={(e) => handleInputChange('expected', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Ne olması bekleniyordu?' : 'What was expected to happen?'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'tr' ? 'Gerçekleşen Sonuç' : 'Actual Result'}
                </label>
                <textarea
                  value={formData.actual}
                  onChange={(e) => handleInputChange('actual', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Ne oldu?' : 'What actually happened?'}
                />
              </div>
            </div>

            {/* Ortam Bilgileri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'tr' ? 'İşletim Sistemi' : 'Operating System'}
                </label>
                <input
                  type="text"
                  value={formData.environment}
                  onChange={(e) => handleInputChange('environment', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Windows 11, macOS, Linux' : 'Windows 11, macOS, Linux'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'tr' ? 'Tarayıcı' : 'Browser'}
                </label>
                <input
                  type="text"
                  value={formData.browser}
                  onChange={(e) => handleInputChange('browser', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Chrome, Firefox, Safari"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'tr' ? 'Cihaz' : 'Device'}
                </label>
                <input
                  type="text"
                  value={formData.device}
                  onChange={(e) => handleInputChange('device', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'tr' ? 'Masaüstü, Mobil, Tablet' : 'Desktop, Mobile, Tablet'}
                />
              </div>
            </div>

            {/* Gönder Butonu */}
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold rounded-full hover:from-red-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {language === 'tr' ? 'Gönderiliyor...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {language === 'tr' ? 'Bildirimi Gönder' : 'Submit Report'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </MotionItem>

      {/* Önemli Notlar */}
      <MotionItem delay={0.2}>
        <div className="glass-effect rounded-xl p-6 text-white">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">
                {language === 'tr' ? 'Önemli Notlar' : 'Important Notes'}
              </h3>
              <ul className="text-sm text-white/80 space-y-1">
                <li>• {language === 'tr' ? 'Lütfen hata hakkında mümkün olduğunca detaylı bilgi verin.' : 'Please provide as much detail as possible about the bug.'}</li>
                <li>• {language === 'tr' ? 'Ekran görüntüleri eklemek hataların çözümünü hızlandırır.' : 'Screenshots help speed up bug resolution.'}</li>
                <li>• {language === 'tr' ? 'Aynı hatayı birden fazla kez bildirmeyin.' : 'Do not report the same bug multiple times.'}</li>
                <li>• {language === 'tr' ? 'Güvenlik açıkları için doğrudan güvenlik@zentaira.com adresine bildirim yapın.' : 'For security vulnerabilities, report directly to security@zentaira.com.'}</li>
              </ul>
            </div>
          </div>
        </div>
      </MotionItem>
    </div>
  )
}
