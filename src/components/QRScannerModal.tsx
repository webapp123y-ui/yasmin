import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-container";

  const startScanner = async () => {
    try {
      setError(null);
      setIsScanning(false);
      
      // Wait for the container to be in the DOM and have dimensions
      let attempts = 0;
      const checkContainer = setInterval(async () => {
        const container = document.getElementById(containerId);
        attempts++;
        
        if (container && container.clientWidth > 0) {
          clearInterval(checkContainer);
          try {
            if (scannerRef.current) {
              try { await scannerRef.current.stop(); } catch (e) {}
            }

            const html5QrCode = new Html5Qrcode(containerId);
            scannerRef.current = html5QrCode;

            const config = {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
            };

            await html5QrCode.start(
              { facingMode: "environment" },
              config,
              (decodedText) => {
                onScan(decodedText);
                stopScanner();
              },
              () => {}
            );
            setIsScanning(true);
          } catch (err: any) {
            console.error("Scanner error:", err);
            const errorMsg = err.toString().toLowerCase();
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || errorMsg.includes('permission')) {
              setError('تم رفض الوصول للكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات المتصفح (أيقونة القفل بجانب شريط العنوان).');
            } else {
              setError('حدث خطأ في تشغيل الكاميرا. يرجى التأكد من منح الإذن وإغلاق التطبيقات الأخرى.');
            }
            setIsScanning(false);
          }
        } else if (attempts > 20) {
          clearInterval(checkContainer);
          setError('تعذر العثور على حاوية الكاميرا.');
        }
      }, 200);
    } catch (err) {
      setError('فشل إعداد الماسح الضوئي.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const requestPermission = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      startScanner();
    } catch (err: any) {
      console.error("Manual permission request failed:", err);
      const errorMsg = err.toString().toLowerCase();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || errorMsg.includes('permission')) {
        setError('تم رفض الوصول للكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات المتصفح (أيقونة القفل بجانب شريط العنوان).');
      } else {
        setError('حدث خطأ أثناء محاولة طلب إذن الكاميرا.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-stone-100">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-stone-900">ماسح الرمز (QR)</h3>
                  <p className="text-stone-500 text-xs sm:text-sm font-medium">وجه الكاميرا نحو كود الطالب</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onClose} 
                  className="p-3 hover:bg-stone-100 rounded-2xl transition-colors text-stone-400 hover:text-stone-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scanner Area */}
            <div className="relative aspect-square sm:aspect-video bg-black overflow-hidden flex items-center justify-center">
              {error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-stone-900 z-50">
                  <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                  <h4 className="text-white text-lg font-bold mb-2">عذراً، تعذر تشغيل الكاميرا</h4>
                  <p className="text-stone-400 text-sm mb-6">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={requestPermission}
                      className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      إعادة المحاولة / طلب الإذن
                    </button>
                    <button 
                      onClick={onClose}
                      className="px-6 py-2.5 bg-stone-800 text-stone-300 rounded-xl font-bold hover:bg-stone-700 transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    id={containerId} 
                    className="w-full h-full [&_video]:object-cover" 
                  />
                  
                  {isScanning && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      {/* Scanner Frame Overlay */}
                      <div className="absolute inset-0 border-[40px] border-black/40" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500 rounded-3xl shadow-[0_0_0_999px_rgba(0,0,0,0.4)]">
                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
                        
                        {/* Scanning Line Animation */}
                        <motion.div 
                          animate={{ top: ['10%', '90%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute left-4 right-4 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-20"
                        />
                      </div>
                    </div>
                  )}

                  {!isScanning && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900">
                      <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                      <p className="text-stone-400 text-sm">جاري تهيئة الكاميرا...</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Info */}
            <div className="p-6 sm:p-8 bg-stone-50">
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm font-medium leading-relaxed">
                  سيتم التعرف على الطالب تلقائياً وفتح ملفه الشخصي بمجرد قراءة الكود بنجاح.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
