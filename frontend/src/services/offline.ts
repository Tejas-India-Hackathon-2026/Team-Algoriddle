export interface OfflinePack {
  id: string;
  destination: string;
  downloadedAt: string;
  itinerary: any;
  contacts: any[];
  notes: string;
}

export function saveOfflinePack(pack: OfflinePack): boolean {
  try {
    const existing = getOfflinePacks();
    const index = existing.findIndex(p => p.id === pack.id);
    if (index > -1) {
      existing[index] = pack;
    } else {
      existing.push(pack);
    }
    localStorage.setItem('yatra_offline_packs', JSON.stringify(existing));
    return true;
  } catch (err) {
    console.error("Failed to save offline pack", err);
    return false;
  }
}

export function getOfflinePacks(): OfflinePack[] {
  try {
    const data = localStorage.getItem('yatra_offline_packs');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

export function deleteOfflinePack(id: string): boolean {
  try {
    const existing = getOfflinePacks();
    const filtered = existing.filter(p => p.id !== id);
    localStorage.setItem('yatra_offline_packs', JSON.stringify(filtered));
    return true;
  } catch (err) {
    return false;
  }
}

export function isOffline(): boolean {
  return !navigator.onLine;
}

// Subscribe to online/offline status changes
export function registerNetworkStatusListener(onStatusChange: (isOnline: boolean) => void) {
  const onlineHandler = () => onStatusChange(true);
  const offlineHandler = () => onStatusChange(false);
  
  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);
  
  return () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  };
}
