import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, MapPin, UserCheck, Navigation } from 'lucide-react';
import { fetchDestinations, fetchHiddenGems, fetchHomestays, fetchFares, addAdminFare } from '../services/api.ts';

export default function Admin() {
  const [destList, setDestList] = useState<any[]>([]);
  const [hiddenList, setHiddenList] = useState<any[]>([]);
  const [fareList, setFareList] = useState<any[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([
    { id: 'v1', host: 'Ramesh Kumar', property: 'Bodhgaya Green Homestay', document: 'Voter ID Proof', date: '18 Aug 2026' },
    { id: 'v2', host: 'Anjali Sharma', property: 'Mithila Art Homestay', document: 'Aadhaar Card Copy', date: '19 Aug 2026' }
  ]);
  const [showAddFareModal, setShowAddFareModal] = useState(false);
  const [newFare, setNewFare] = useState({
    origin: '',
    destination: '',
    district: 'Patna',
    transportType: 'BSRTC Bus',
    operator: 'BSRTC',
    fare: '',
    fareUnit: 'PER_PERSON',
    fareType: 'OFFICIAL',
    source: 'Official Transport Tariff'
  });
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchDestinations().then(data => setDestList(data));
    fetchHiddenGems().then(data => setHiddenList(data));
    fetchFares().then(data => setFareList(data));
  }, []);

  const handleApproveVerification = (id: string, host: string) => {
    setVerificationRequests(prev => prev.filter(r => r.id !== id));
    setToast(`✓ Approved host verification for ${host}.`);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreateFare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFare.origin || !newFare.destination || !newFare.fare) return;

    const res = await addAdminFare(newFare);
    if (res.success && res.fare) {
      setFareList(prev => [res.fare, ...prev]);
      setShowAddFareModal(false);
      setNewFare({
        origin: '',
        destination: '',
        district: 'Patna',
        transportType: 'BSRTC Bus',
        operator: 'BSRTC',
        fare: '',
        fareUnit: 'PER_PERSON',
        fareType: 'OFFICIAL',
        source: 'Official Transport Tariff'
      });
      setToast(`✓ Verified fare added for ${res.fare.origin} → ${res.fare.destination}`);
      setTimeout(() => setToast(''), 3000);
    }
  };
  

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-bold text-yatra-charcoal flex items-center gap-2">
            <Settings className="w-8 h-8 text-yatra-terracotta" /> Bihar Yatra Admin Console
          </h1>
          <p className="text-sm text-yatra-slate font-light">Manage catalog indices, verify owner identity uploads, and maintain genuine FareGuard transport tariffs.</p>
        </div>
        <span className="bg-red-500/10 text-red-600 border border-red-200 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest">
          Role: Super Admin
        </span>
      </div>

      {toast && (
        <div className="bg-yatra-forest/10 border border-yatra-forest/20 text-yatra-forest p-4 rounded-xl text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}

      {/* Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Requests */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <UserCheck className="w-5 h-5 text-yatra-terracotta" /> Identity Verifications ({verificationRequests.length})
          </h3>

          <div className="space-y-4">
            {verificationRequests.map(req => (
              <div key={req.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-3">
                <div>
                  <strong className="block text-gray-700 text-sm font-medium">{req.property}</strong>
                  <span className="text-[10px] text-gray-400 block mt-0.5">Host: {req.host} | Filed: {req.date}</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-2 text-[10px] text-gray-500 flex items-center gap-1 text-left">
                  🔒 Document: {req.document} (Secure Sandbox)
                </div>
                <button
                  onClick={() => handleApproveVerification(req.id, req.host)}
                  className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white text-[10px] font-bold py-2 rounded-lg transition-colors"
                >
                  Verify Host Identity
                </button>
              </div>
            ))}

            {verificationRequests.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400 font-light">
                No pending identity requests.
              </div>
            )}
          </div>
        </div>

        {/* Standard Catalog Lists & FareGuard Directory */}
        <div className="lg:col-span-2 space-y-8">
          {/* FareGuard Verified Transport Tariffs */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5">
                  <Navigation className="w-5 h-5 text-yatra-terracotta" /> FareGuard Transport Tariffs ({fareList.length})
                </h3>
                <p className="text-[11px] text-gray-400 font-light">Official government, prepaid, and verified operator routes across Bihar.</p>
              </div>
              <button 
                onClick={() => setShowAddFareModal(!showAddFareModal)}
                className="bg-yatra-terracotta/10 text-yatra-terracotta text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-yatra-terracotta/15 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Fare
              </button>
            </div>

            {showAddFareModal && (
              <form onSubmit={handleCreateFare} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-3">
                <strong className="block text-yatra-charcoal font-semibold">Register New Verified Route Fare:</strong>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Origin (e.g. Patna Junction)"
                    value={newFare.origin}
                    onChange={e => setNewFare({ ...newFare, origin: e.target.value })}
                    className="p-2 rounded-lg border border-gray-200 bg-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Destination (e.g. Bihar Museum)"
                    value={newFare.destination}
                    onChange={e => setNewFare({ ...newFare, destination: e.target.value })}
                    className="p-2 rounded-lg border border-gray-200 bg-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Fare in ₹"
                    value={newFare.fare}
                    onChange={e => setNewFare({ ...newFare, fare: e.target.value })}
                    className="p-2 rounded-lg border border-gray-200 bg-white"
                    required
                  />
                  <select
                    value={newFare.fareUnit}
                    onChange={e => setNewFare({ ...newFare, fareUnit: e.target.value })}
                    className="p-2 rounded-lg border border-gray-200 bg-white"
                  >
                    <option value="PER_PERSON">Per Person</option>
                    <option value="PER_VEHICLE">Per Vehicle</option>
                  </select>
                  <select
                    value={newFare.fareType}
                    onChange={e => setNewFare({ ...newFare, fareType: e.target.value })}
                    className="p-2 rounded-lg border border-gray-200 bg-white"
                  >
                    <option value="OFFICIAL">Official Government</option>
                    <option value="PREPAID">Prepaid Booth</option>
                    <option value="VERIFIED">Verified Operator</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Source (e.g. BSRTC Official Notice)"
                    value={newFare.source}
                    onChange={e => setNewFare({ ...newFare, source: e.target.value })}
                    className="p-2 rounded-lg border border-gray-200 bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddFareModal(false)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-yatra-terracotta text-white font-bold rounded-lg hover:bg-yatra-amber transition-colors"
                  >
                    Save Verified Tariff
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-2">
              {fareList.map((f, idx) => (
                <div key={f.id || idx} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                  <div>
                    <div className="font-semibold text-yatra-charcoal flex items-center gap-1.5">
                      <span>{f.origin} → {f.destination}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        f.fareType === 'OFFICIAL' ? 'bg-emerald-100 text-emerald-800' :
                        f.fareType === 'PREPAID' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {f.fareType}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      {f.transportType} • {f.operator} ({f.fareUnit === 'PER_PERSON' ? 'Per Person' : 'Per Vehicle'})
                    </span>
                    <span className="text-[10px] text-gray-400 block">Source: {f.source}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-bold text-yatra-terracotta block">₹{f.fare}</span>
                    <span className="text-[9px] text-emerald-600 font-semibold">✓ Verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dest catalog list */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5">
                <MapPin className="w-5 h-5 text-yatra-terracotta" /> Tourism Destinations ({destList.length + hiddenList.length})
              </h3>
              <button className="bg-yatra-terracotta/10 text-yatra-terracotta text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-yatra-terracotta/15 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Location
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {destList.concat(hiddenList).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-xs border border-gray-100">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <strong className="block text-gray-700 font-medium">{item.name}</strong>
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        {item.category} | {item.hiddenGemScore ? `Hidden Gem (Score: ${item.hiddenGemScore})` : `Popular Spot`}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button className="p-1.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 text-gray-500">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 bg-white rounded-lg border border-red-200 hover:bg-red-50 text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
