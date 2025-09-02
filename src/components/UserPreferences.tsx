import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserPreferences } from '@/hooks/useAgentPipeline';
import { useAuth } from '@/contexts/AuthContext';
import { ContentFormat, ContentLanguage, ContentTone } from '@/types/agents';
import { Settings, Languages, FileText, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

const UserPreferences = () => {
  const { user } = useAuth();
  const { preferences, updatePreferences, isUpdating } = useUserPreferences(user?.id);
  const [showPreferences, setShowPreferences] = useState(false);

  const languageOptions = [
    { value: 'en' as ContentLanguage, label: 'English', flag: '🇺🇸' },
    { value: 'es' as ContentLanguage, label: 'Español', flag: '🇪🇸' },
    { value: 'hi' as ContentLanguage, label: 'हिन्दी', flag: '🇮🇳' },
    { value: 'fr' as ContentLanguage, label: 'Français', flag: '🇫🇷' },
    { value: 'de' as ContentLanguage, label: 'Deutsch', flag: '🇩🇪' }
  ];

  const formatOptions = [
    { value: 'text' as ContentFormat, label: 'Article', icon: FileText, description: 'Full article format' },
    { value: 'bullets' as ContentFormat, label: 'Bullets', icon: FileText, description: 'Key points in bullet format' },
    { value: 'carousel' as ContentFormat, label: 'Carousel', icon: FileText, description: 'Card-based slides' },
    { value: 'video_script' as ContentFormat, label: 'Video Script', icon: Volume2, description: '60-second video script' },
    { value: 'summary' as ContentFormat, label: 'Summary', icon: FileText, description: 'Quick 3-4 paragraph summary' }
  ];

  const toneOptions = [
    { value: 'professional' as ContentTone, label: 'Professional', description: 'Formal and authoritative' },
    { value: 'casual' as ContentTone, label: 'Casual', description: 'Relaxed and conversational' },
    { value: 'friendly' as ContentTone, label: 'Friendly', description: 'Warm and approachable' },
    { value: 'technical' as ContentTone, label: 'Technical', description: 'Detailed and precise' },
    { value: 'gen_z' as ContentTone, label: 'Gen-Z', description: 'Modern and trendy' }
  ];

  const handleUpdatePreference = async (field: string, value: string) => {
    try {
      await updatePreferences.mutateAsync({ [field]: value });
    } catch (error) {
      console.error('Failed to update preference:', error);
      toast.error('Failed to update preference');
    }
  };

  if (!user) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowPreferences(!showPreferences)}
        className="bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card/90"
      >
        <Settings className="w-4 h-4 mr-2" />
        Preferences
      </Button>

      {showPreferences && (
        <Card className="absolute top-12 right-0 w-80 p-4 bg-card/95 backdrop-blur-lg border border-border/50 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Content Preferences</h3>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">Language</label>
              </div>
              <Select
                value={preferences?.language || 'en'}
                onValueChange={(value) => handleUpdatePreference('language', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.flag}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">Content Format</label>
              </div>
              <Select
                value={preferences?.format || 'text'}
                onValueChange={(value) => handleUpdatePreference('format', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tone Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <label className="text-sm font-medium text-foreground">Tone</label>
              </div>
              <Select
                value={preferences?.tone || 'professional'}
                onValueChange={(value) => handleUpdatePreference('tone', value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="bg-background/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Your preferences are automatically applied to all news articles for a personalized experience.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UserPreferences;