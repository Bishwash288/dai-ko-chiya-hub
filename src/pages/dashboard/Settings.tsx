import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Store, 
  Image, 
  Link2, 
  Bell, 
  Volume2, 
  Copy, 
  Upload,
  Play,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { shopSettings, currentShop, updateShopSettings, uploadShopLogo } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    shopName: shopSettings.shopName,
    description: shopSettings.description,
    numberOfTables: shopSettings.numberOfTables,
  });

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const shopUrl = currentShop ? `${baseUrl}/shop/${currentShop.slug}/menu` : `${baseUrl}/menu`;

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateShopSettings({
      name: formData.shopName,
      description: formData.description,
      numberOfTables: formData.numberOfTables,
    });
    setIsSaving(false);
    
    if (success) {
      toast.success('Settings saved successfully!');
    } else {
      toast.error('Failed to save settings');
    }
  };

  const copyShopUrl = () => {
    navigator.clipboard.writeText(shopUrl);
    toast.success('Shop URL copied to clipboard!');
  };

  const testSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    toast.success('Sound test played!');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await updateShopSettings({ browserNotifications: true });
      new Notification(shopSettings.shopName, {
        body: 'Browser notifications enabled!',
        icon: shopSettings.logoUrl || '/favicon.ico',
      });
      toast.success('Browser notifications enabled!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    const url = await uploadShopLogo(file);
    setIsUploading(false);
    
    if (url) {
      toast.success('Logo uploaded successfully!');
    } else {
      toast.error('Failed to upload logo');
    }
  };

  const handleToggleOpen = async (checked: boolean) => {
    await updateShopSettings({ isOpen: checked });
  };

  const handleToggleSoundAlerts = async (checked: boolean) => {
    await updateShopSettings({ soundAlerts: checked });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your shop preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Status Card */}
        <Card className="overflow-hidden">
          <div className={`h-1 ${shopSettings.isOpen ? 'bg-success' : 'bg-destructive'}`} />
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Shop Status</h3>
                  <p className={`text-sm ${shopSettings.isOpen ? 'text-success' : 'text-destructive'}`}>
                    {shopSettings.isOpen ? 'Open for orders' : 'Closed'}
                  </p>
                </div>
              </div>
              <Switch
                checked={shopSettings.isOpen}
                onCheckedChange={handleToggleOpen}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shop Information Card */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              <CardTitle className="font-display text-lg">Shop Information</CardTitle>
            </div>
            <CardDescription>Update your shop details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={(e) => setFormData(prev => ({ ...prev, shopName: e.target.value }))}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell customers about your shop..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="tables">Number of Tables</Label>
              <Input
                id="tables"
                type="number"
                min={1}
                max={100}
                value={formData.numberOfTables}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfTables: parseInt(e.target.value) || 1 }))}
                className="mt-1.5 w-32"
              />
              <p className="text-xs text-muted-foreground mt-1">Determines QR code count</p>
            </div>

            <Button 
              onClick={handleSave}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Logo Upload Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Shop Logo</h3>
                <p className="text-sm text-muted-foreground">Max 2MB (JPEG/PNG/WebP/GIF)</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-secondary/30 overflow-hidden">
                {shopSettings.logoUrl ? (
                  <img 
                    src={shopSettings.logoUrl} 
                    alt="Shop logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shop URL Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-secondary rounded-lg">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Shop URL</h3>
                <p className="text-sm text-muted-foreground">Share this link with your customers</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Input 
                value={shopUrl} 
                readOnly 
                className="bg-secondary/50 font-mono text-sm"
              />
              <Button variant="outline" onClick={copyShopUrl}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 bg-secondary rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">Configure order notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Sound Alerts */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Sound Alerts</h4>
                    <p className="text-sm text-muted-foreground">Play sound for new orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={testSound}
                    disabled={!shopSettings.soundAlerts}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Test
                  </Button>
                  <Switch
                    checked={shopSettings.soundAlerts}
                    onCheckedChange={handleToggleSoundAlerts}
                  />
                </div>
              </div>

              {/* Browser Notifications */}
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-lg">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Browser Notifications</h4>
                    <p className="text-sm text-muted-foreground">Desktop notifications for orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!shopSettings.browserNotifications && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={requestNotificationPermission}
                    >
                      Enable
                    </Button>
                  )}
                  <Switch
                    checked={shopSettings.browserNotifications}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        requestNotificationPermission();
                      } else {
                        updateShopSettings({ browserNotifications: false });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
