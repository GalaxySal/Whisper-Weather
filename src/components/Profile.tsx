import { User, Edit2, Save, X, Camera } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { translations } from '@/lib/translations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import PlacesAutocomplete from './PlacesAutocomplete'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useTauri } from '@/hooks/use-tauri'

interface ProfileData {
  display_name: string
  bio: string
  location: string
  website: string
}

export default function Profile({ user }: { user: any }) {
  const { language } = useLanguage()
  const t = translations[language]
  const { isTauri } = useTauri()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: user.user_metadata?.display_name || '',
    bio: user.user_metadata?.bio || '',
    location: user.user_metadata?.location || '',
    website: user.user_metadata?.website || ''
  })
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.charAt(0).toUpperCase()}&background=6366f1&color=fff`
  )
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...profileData,
          avatar_url: avatarUrl
        }
      })

      if (error) throw error

      setIsEditing(false)
      toast.success(t.profile.profileUpdated)
    } catch (error) {
      toast.error(t.profile.errorOccurred)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalı')
      return
    }

    // Desteklenen formatlar
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Sadece JPEG, PNG, GIF ve WebP formatları desteklenir')
      return
    }

    setIsUploading(true)

    try {
      if (isTauri) {
        // Tauri'de dosyayı base64'e çevir
        const base64 = await fileToBase64(file)
        const fileName = `avatar-${user.id}-${Date.now()}.${file.type.split('/')[1]}`
        
        // Supabase Storage'a yükle
        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, base64, {
            contentType: file.type,
            upsert: true
          })

        if (error) throw error

        // Public URL al
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        setAvatarUrl(publicUrl)
        toast.success('Profil resmi güncellendi')
      } else {
        // Web'de doğrudan yükle
        const fileName = `avatar-${user.id}-${Date.now()}`
        
        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: true
          })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        setAvatarUrl(publicUrl)
        toast.success('Profil resmi güncellendi')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Profil resmi yüklenemedi')
    } finally {
      setIsUploading(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleAvatarUpload(file)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleCancel = () => {
    setProfileData({
      display_name: user.user_metadata?.display_name || '',
      bio: user.user_metadata?.bio || '',
      location: user.user_metadata?.location || '',
      website: user.user_metadata?.website || ''
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-effect rounded-2xl p-8 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <User className="w-6 h-6 mr-2" />
            {t.profile.title}
          </h2>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              size="sm"
              className="bg-white/10 hover:bg-white/20 border border-white/20"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {t.profile.edit}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40"
              >
                <Save className="w-4 h-4 mr-2" />
                {t.profile.save}
              </Button>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                className="bg-white/10 hover:bg-white/20 border border-white/20"
              >
                <X className="w-4 h-4 mr-2" />
                {t.profile.cancel}
              </Button>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          {/* Profil Resmi */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">{t.profile.avatar}</h3>
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Profile Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.email?.charAt(0).toUpperCase()}&background=6366f1&color=fff`
                  }}
                />
                {isEditing && (
                  <button
                    onClick={triggerFileSelect}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <p className="text-white/80 text-sm mb-2">
                  Profil resminizi güncellemek için kamera ikonuna tıklayın
                </p>
                <p className="text-white/60 text-xs">
                  Desteklenen formatlar: JPEG, PNG, GIF, WebP (Max 5MB)
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">{t.profile.personalInfo}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  {t.profile.name}
                </label>
                {isEditing ? (
                  <input
                    id="display-name"
                    name="display-name"
                    type="text"
                    value={profileData.display_name}
                    onChange={(e) => setProfileData({...profileData, display_name: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder={t.profile.enterYourName}
                  />
                ) : (
                  <p className="text-white">
                    {profileData.display_name || t.profile.notSpecified}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  {t.profile.bio}
                </label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/40 resize-none"
                    placeholder={t.profile.tellAboutYourself}
                    rows={4}
                  />
                ) : (
                  <p className="text-white whitespace-pre-wrap">
                    {profileData.bio || (language === 'tr' ? 'Biyografi belirtilmemiş' : 'No bio specified')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  {t.profile.location}
                </label>
                {isEditing ? (
                  <PlacesAutocomplete
                    onPlaceSelect={(place: string) => setProfileData({...profileData, location: place})}
                    placeholder={t.profile.cityCountry}
                    className="w-full"
                  />
                ) : (
                  <p className="text-white">
                    {profileData.location || t.profile.notSpecified}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">
                  {t.profile.website}
                </label>
                {isEditing ? (
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="https://example.com"
                  />
                ) : (
                  <p className="text-white">
                    {profileData.website ? (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                        {profileData.website}
                      </a>
                    ) : (
                      <span>{t.profile.notSpecified}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">{t.profile.accountInfo}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">{t.profile.email}:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">{t.profile.memberSince}:</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">ID:</span>
                <span className="font-medium text-sm">{user.id}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold mb-4">{t.profile.preferences}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/80">{t.navigation.language}:</span>
                <span className="font-medium">{language === 'tr' ? 'Türkçe' : 'English'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/80">{t.navigation.theme}:</span>
                <span className="font-medium">{t.profile.systemDefault}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
