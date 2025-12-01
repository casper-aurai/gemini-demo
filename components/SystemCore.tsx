
import React, { useEffect, useState } from 'react';
import { Save, UploadCloud, Database, ShieldCheck, Lock, Globe, RefreshCcw } from 'lucide-react';
import { SecuritySettings } from '../types';

interface SystemCoreProps {
    exportData: () => void;
    importData: (json: string) => void;
    securitySettings: SecuritySettings;
    onUpdateSecurity: (partial: Partial<SecuritySettings>) => void;
    onSync: () => void;
    syncStatus?: string;
}

const SystemCore: React.FC<SystemCoreProps> = ({ exportData, importData, securitySettings, onUpdateSecurity, onSync, syncStatus }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'backup' | 'security'>('general');
    const [cloudEndpoint, setCloudEndpoint] = useState(securitySettings.cloudEndpoint);
    const [passphrase, setPassphrase] = useState(securitySettings.passphrase);

    useEffect(() => {
        setCloudEndpoint(securitySettings.cloudEndpoint);
        setPassphrase(securitySettings.passphrase);
    }, [securitySettings]);

    const handleImport = () => {
        const json = prompt("Paste full JSON backup string here:");
        if (json) {
            try {
                importData(json);
                alert("System restored successfully.");
            } catch (e) {
                alert("Invalid JSON data.");
            }
        }
    };

    return (
        <div className="p-8 h-full bg-zinc-50 flex flex-col">
             <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="font-serif text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <Database /> System Core
                    </h2>
                    <p className="text-zinc-500 text-sm">Data sovereignty and configuration.</p>
                </div>
            </header>

            <div className="flex-1 bg-white rounded-xl border border-zinc-200 shadow-sm flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-zinc-100 bg-zinc-50/50 p-4 space-y-1">
                    <button 
                        onClick={() => setActiveTab('general')}
                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'general' ? 'bg-white shadow-sm text-zinc-900 border border-zinc-200' : 'text-zinc-500 hover:bg-zinc-100'}`}
                    >
                        General Settings
                    </button>
                    <button 
                        onClick={() => setActiveTab('backup')}
                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'backup' ? 'bg-white shadow-sm text-zinc-900 border border-zinc-200' : 'text-zinc-500 hover:bg-zinc-100'}`}
                    >
                        Backup & Restore
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'security' ? 'bg-white shadow-sm text-zinc-900 border border-zinc-200' : 'text-zinc-500 hover:bg-zinc-100'}`}
                    >
                        Security & Cloud
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'general' && (
                        <div className="max-w-2xl space-y-6">
                            <h3 className="font-bold text-lg text-zinc-900 border-b border-zinc-100 pb-2">Workspace Configuration</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Unit System</label>
                                    <select className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm">
                                        <option>Metric (mm, kg)</option>
                                        <option>Imperial (in, lbs)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Theme</label>
                                    <select className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm">
                                        <option>Construct OS Pro (Dark/Light)</option>
                                        <option>High Contrast</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="max-w-2xl space-y-6">
                            <h3 className="font-bold text-lg text-zinc-900 border-b border-zinc-100 pb-2">Data Sovereignty</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <button 
                                    onClick={exportData}
                                    className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-white transition-all flex flex-col items-center group text-center"
                                >
                                    <Save size={24} className="text-zinc-400 group-hover:text-zinc-900 mb-3 transition-colors" />
                                    <h4 className="font-bold text-zinc-800">Export Registry</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Download JSON dump of projects & assets.</p>
                                </button>
                                <button 
                                    onClick={handleImport}
                                    className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-white transition-all flex flex-col items-center group text-center"
                                >
                                    <RefreshCcw size={24} className="text-zinc-400 group-hover:text-zinc-900 mb-3 transition-colors" />
                                    <h4 className="font-bold text-zinc-800">Import System</h4>
                                    <p className="text-xs text-zinc-500 mt-1">Restore from a previous backup file.</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                         <div className="max-w-2xl space-y-6">
                            <h3 className="font-bold text-lg text-zinc-900 border-b border-zinc-100 pb-2">Security & Cloud</h3>

                            <div className="space-y-3 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Lock size={18} className="text-zinc-700"/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-zinc-800">Local Encryption</h4>
                                        <p className="text-xs text-zinc-500">AES-GCM encrypted local snapshots using your passphrase.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 items-end">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Passphrase</label>
                                        <input
                                            type="password"
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm"
                                            placeholder="Set a local encryption secret"
                                        />
                                    </div>
                                    <button
                                        onClick={() => onUpdateSecurity({ passphrase })}
                                        className="bg-zinc-900 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-black transition-colors"
                                    >
                                        Save Passphrase
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                                <div className="flex items-center gap-3 justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-full shadow-sm">
                                            <Globe size={18} className="text-zinc-700"/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-zinc-800">Cloud Sync (Beta)</h4>
                                            <p className="text-xs text-zinc-500">Post encrypted snapshots to a remote endpoint.</p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => onUpdateSecurity({ cloudEnabled: !securitySettings.cloudEnabled })}
                                        className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative ${securitySettings.cloudEnabled ? 'bg-green-500' : 'bg-zinc-300'}`}
                                    >
                                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${securitySettings.cloudEnabled ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 items-end">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Sync Endpoint</label>
                                        <input
                                            type="text"
                                            value={cloudEndpoint}
                                            onChange={(e) => setCloudEndpoint(e.target.value)}
                                            className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm"
                                            placeholder="https://relay.example.com/snapshot"
                                        />
                                    </div>
                                    <button
                                        onClick={() => onUpdateSecurity({ cloudEndpoint })}
                                        className="bg-zinc-900 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-black transition-colors"
                                    >
                                        Save Endpoint
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={onSync}
                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-zinc-200 bg-white hover:bg-zinc-100"
                                        disabled={!securitySettings.cloudEnabled}
                                    >
                                        <UploadCloud size={16} />
                                        Manual Sync
                                    </button>
                                    <span className="text-xs text-zinc-500">Status: {syncStatus || 'Idle'}</span>
                                </div>
                            </div>

                             <div className="mt-8 bg-green-50 p-4 rounded-lg flex items-center gap-4 border border-green-100">
                                <ShieldCheck className="text-green-600" size={24} />
                                <div>
                                    <h4 className="font-bold text-sm text-green-900">Environment Secure</h4>
                                    <p className="text-xs text-green-700">Construct OS is running in a sandbox. No external telemetry.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemCore;
