import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

const VERSION_STORAGE_KEY = 'app_build_version';
const CHECK_INTERVAL = 60000; // 60 seconds

interface VersionData {
  buildDate: number;
  buildTime?: string;
}

export function VersionChecker() {
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  const checkForUpdates = async () => {
    try {
      
      // Fetch version.json with cache busting
      const response = await fetch(`/version.json?t=${Date.now()}`);
      
      if (!response.ok) {
        // If version.json doesn't exist yet (first deployment), skip check
        return;
      }

      const serverVersion: VersionData = await response.json();
      const localVersion = localStorage.getItem(VERSION_STORAGE_KEY);

      // If no local version, save current and exit
      if (!localVersion) {
        localStorage.setItem(VERSION_STORAGE_KEY, serverVersion.buildDate.toString());
        return;
      }

      const localBuildDate = parseInt(localVersion, 10);
      const serverBuildDate = serverVersion.buildDate;

      // If server version is newer, show update banner
      if (serverBuildDate > localBuildDate) {
        setShowUpdateBanner(true);
      }
    } catch (error) {
      // Silently fail - version.json might not exist in dev or first deployment
      console.debug('Version check failed (this is normal in development):', error);
    }
  };

  useEffect(() => {
    // Check immediately on mount
    checkForUpdates();

    // Set up interval to check periodically
    const interval = setInterval(checkForUpdates, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    // Save new version to localStorage
    fetch(`/version.json?t=${Date.now()}`)
      .then(res => res.json())
      .then((version: VersionData) => {
        localStorage.setItem(VERSION_STORAGE_KEY, version.buildDate.toString());
      })
      .catch(() => {
        // If fetch fails, use current timestamp as fallback
        localStorage.setItem(VERSION_STORAGE_KEY, Date.now().toString());
      });

    // Force reload
    window.location.reload();
  };

  const handleDismiss = () => {
    // Update local version to current server version to suppress banner
    fetch(`/version.json?t=${Date.now()}`)
      .then(res => res.json())
      .then((version: VersionData) => {
        localStorage.setItem(VERSION_STORAGE_KEY, version.buildDate.toString());
      })
      .catch(() => {
        localStorage.setItem(VERSION_STORAGE_KEY, Date.now().toString());
      });
    
    setShowUpdateBanner(false);
  };

  if (!showUpdateBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <div>
            <p className="font-semibold">Nova atualização disponível!</p>
            <p className="text-sm text-blue-100">
              Uma nova versão do aplicativo está disponível. Atualize para ver as melhorias.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-blue-700 rounded transition-colors"
            aria-label="Dispensar"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-white text-blue-600 font-semibold rounded hover:bg-blue-50 transition-colors"
          >
            Atualizar Agora
          </button>
        </div>
      </div>
    </div>
  );
}
