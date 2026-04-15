import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XMarkIcon } from '@heroicons/react/24/outline';

const BarcodeScanner = ({ onScan, onClose, onError }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Inicializar scanner
    scannerRef.current = new Html5Qrcode('barcode-reader');
    
    // Obtener cámaras disponibles
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          // Buscar cámara trasera
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('trasera')
          );
          const cameraToUse = backCamera || devices[0];
          setSelectedCamera(cameraToUse.id);
          startScanner(cameraToUse.id);
        } else {
          setError('No se encontraron cámaras');
        }
      })
      .catch(err => {
        console.error('Error getting cameras:', err);
        setError('Error al acceder a las cámaras: ' + err.message);
      });

    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async (cameraId) => {
    if (!scannerRef.current) return;
    
    try {
      setScanning(true);
      setError(null);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 1.5,
      };
      
      await scannerRef.current.start(
        cameraId,
        config,
        (decodedText) => {
          // Éxito al escanear
          if (decodedText && decodedText.length > 0) {
            scannerRef.current.stop().catch(console.error);
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Error normal durante escaneo (ignorar)
          console.log('Scanning...');
        }
      );
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setScanning(false);
      setError('No se pudo iniciar la cámara: ' + err.message);
    }
  };

  const switchCamera = async (cameraId) => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        setSelectedCamera(cameraId);
        await startScanner(cameraId);
      } catch (err) {
        console.error('Error switching camera:', err);
        setError('Error al cambiar de cámara');
      }
    }
  };

  const handleClose = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black p-4 flex items-center justify-between">
        <h3 className="text-white font-semibold">Escanear Código</h3>
        <button onClick={handleClose} className="p-2">
          <XMarkIcon className="h-6 w-6 text-white" />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-red-100 text-red-800 p-4 rounded-xl text-center">
            <p className="font-semibold mb-2">❌ Error</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={handleClose}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Selector de cámara */}
          {cameras.length > 1 && (
            <div className="bg-black px-4 pb-2">
              <select
                value={selectedCamera}
                onChange={(e) => switchCamera(e.target.value)}
                className="w-full p-2 bg-gray-800 text-white rounded-lg text-sm"
              >
                {cameras.map(camera => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Cámara ${camera.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Área de escaneo */}
          <div className="flex-1 relative bg-black">
            <div id="barcode-reader" className="w-full h-full"></div>
            
            {/* Guía visual */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-72 h-40 border-2 border-green-400 rounded-lg opacity-60"></div>
            </div>
            
            {/* Texto de ayuda */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <p className="text-white text-sm bg-black bg-opacity-60 py-2 px-4 inline-block rounded-full">
                📷 Apunta el código al recuadro verde
              </p>
            </div>
          </div>

          {/* Botón cancelar */}
          <div className="bg-black p-6">
            <button
              onClick={handleClose}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-medium"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BarcodeScanner;
