import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Copy, Info, Image } from 'lucide-react';
import { toast } from 'sonner';

const QRCodes = () => {
  const { shopSettings, currentShop } = useApp();
  const qrRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const getTableUrl = (tableNumber: number) => {
    if (currentShop) {
      return `${baseUrl}/shop/${currentShop.slug}/menu?table=${tableNumber}`;
    }
    return `${baseUrl}/menu?table=${tableNumber}`;
  };

  const copyUrl = (tableNumber: number) => {
    navigator.clipboard.writeText(getTableUrl(tableNumber));
    toast.success(`Table ${tableNumber} URL copied!`);
  };

  const downloadQR = async (tableNumber: number) => {
    const qrElement = qrRefs.current[tableNumber];
    if (!qrElement) return;

    const svg = qrElement.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = async () => {
      canvas.width = 300;
      canvas.height = 380;
      
      if (ctx) {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw logo if available
        if (shopSettings.logoUrl) {
          try {
            const logoImg = new window.Image();
            logoImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              logoImg.onload = resolve;
              logoImg.onerror = reject;
              logoImg.src = shopSettings.logoUrl!;
            });
            // Draw centered logo at top
            const logoSize = 50;
            ctx.drawImage(logoImg, (canvas.width - logoSize) / 2, 10, logoSize, logoSize);
          } catch {
            // If logo fails to load, continue without it
          }
        }
        
        // Draw QR code
        const qrY = shopSettings.logoUrl ? 70 : 20;
        ctx.drawImage(img, 25, qrY, 250, 250);
        
        // Draw table number
        ctx.fillStyle = '#5c3a21';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Table ${tableNumber}`, canvas.width / 2, shopSettings.logoUrl ? 350 : 300);
        
        // Draw shop name
        ctx.fillStyle = '#8b7355';
        ctx.font = '14px Arial';
        ctx.fillText(shopSettings.shopName, canvas.width / 2, shopSettings.logoUrl ? 370 : 320);
      }

      const link = document.createElement('a');
      link.download = `${currentShop?.slug || 'shop'}-table-${tableNumber}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadAll = async () => {
    toast.info('Downloading all QR codes...');
    
    for (let i = 1; i <= shopSettings.numberOfTables; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await downloadQR(i);
    }
    
    toast.success('All QR codes downloaded!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">QR Codes</h1>
          <p className="text-muted-foreground mt-1">Customized QR codes for each table</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {shopSettings.numberOfTables} Tables
          </Badge>
          <Button onClick={downloadAll} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {/* Info Alerts */}
      <div className="space-y-3">
        <Alert className="bg-secondary/50 border-border">
          <Info className="w-4 h-4" />
          <AlertDescription>
            <strong>Print-ready QR codes</strong><br />
            Each QR code includes your shop logo and is styled for a professional look. Click "Save" to download individual QR codes or "Download All" to get all at once.
          </AlertDescription>
        </Alert>

        {!shopSettings.logoUrl && (
          <Alert className="bg-warning/10 border-warning/30">
            <Image className="w-4 h-4 text-warning" />
            <AlertDescription className="text-warning">
              <strong>No logo uploaded</strong><br />
              Upload your shop logo in Settings to personalize your QR codes with your brand.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: shopSettings.numberOfTables }, (_, i) => i + 1).map(tableNumber => (
          <Card key={tableNumber} className="overflow-hidden hover:shadow-warm transition-shadow duration-300">
            <CardContent className="p-4">
              {/* Logo preview */}
              {shopSettings.logoUrl && (
                <div className="flex justify-center mb-2">
                  <img 
                    src={shopSettings.logoUrl} 
                    alt={shopSettings.shopName} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
              )}
              
              {/* QR Code */}
              <div 
                ref={el => qrRefs.current[tableNumber] = el}
                className="bg-card p-4 rounded-lg flex items-center justify-center"
              >
                <QRCodeSVG
                  value={getTableUrl(tableNumber)}
                  size={150}
                  level="M"
                  includeMargin={false}
                  fgColor="hsl(25, 60%, 30%)"
                  bgColor="transparent"
                />
              </div>

              {/* Table Info */}
              <div className="text-center mt-3">
                <Badge variant="outline" className="font-semibold mb-1">
                  Table {tableNumber}
                </Badge>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {currentShop ? `/shop/${currentShop.slug}/menu?table=${tableNumber}` : `/menu?table=${tableNumber}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => copyUrl(tableNumber)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => downloadQR(tableNumber)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QRCodes;
