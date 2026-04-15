import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';

const BarcodeScanner = ({ onScan, onClose, onError }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('environment');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Obtener cámaras disponibles
    Html5QrcodeScanner.listCameras(true)
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Preferir cámara trasera
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'));
          if (backCamera) {
            setSelectedCamera(backCamera.id);
          }
        }
      })
      .catch(err => console.log('Error getting cameras:', err));
  }, []);

  useEffect(() => {
    let scanner = null;
    
    const startScanner = async () => {
      try {
        scanner = new Html5QrcodeScanner(
          'barcode-reader',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 100 },
            aspectRatio: 1.5,
            disableFlip: false,
            rememberLastUsedCamera: false,
            supportedScanTypes: [
              Html5QrcodeScanner.SCAN_TYPE_CAMERA,
              Html5QrcodeScanner.SCAN_TYPE_FILE
            ]
          },
          false
        );
        
        setScanning(true);
        
        await scanner.render(
          (decodedText) => {
            // Éxito al escanear
            if (decodedText && decodedText.length > 0) {
              onScan(decodedText);
              scanner.clear();
              onClose();
            }
          },
          (error) => {
            // Error de escaneo (ignorar, es normal mientras busca)
            console.log('Scanning...');
          }
        );
      } catch (err) {
        console.error('Scanner error:', err);
        if (onError) onError(err);
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [selectedCamera]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black p-4 flex items-center justify-between">
        <h3 className="text-white font-semibold">Escanear Código</h3>
        <button onClick={onClose} className="p-2">
          <XMarkIcon className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Selector de cámara */}
      {cameras.length > 1 && (
        <div className="bg-black px-4 pb-2">
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded-lg text-sm"
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Cámara ${camera.id.slice(0, 5)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Área de escaneo */}
      <div className="flex-1 relative">
        <div id="barcode-reader" className="w-full h-full"></div>
        
        {/* Guía visual */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-64 h-32 border-2 border-green-400 rounded-lg opacity-50"></div>
          </div>
        </div>
        
        {/* Texto de ayuda */}
        <div className="absolute bottom-20 left-0 right-0 text-center">
          <p className="text-white text-sm bg-black bg-opacity-50 py-2 px-4 inline-block rounded-full">
            Apunta el código de barras al recuadro
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="bg-black p-6 flex gap-3">
        <button
          onClick={() => {
            // Activar flash/torch si está disponible
            const track = Html5QrcodeScanner.getTrack();
            if (track) {
              track.applyConstraints({
                advanced: [{ torch: true }]
              });
            }
          }}
          className="flex-1 bg-gray-800 text-white py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <span>🔦</span> Linterna
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-red-600 text-white py-3 rounded-xl"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
