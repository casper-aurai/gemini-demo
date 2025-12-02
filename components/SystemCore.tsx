
import React, { useEffect, useMemo, useState } from 'react';
import { Save, UploadCloud, Database, ShieldCheck, Lock, Globe, RefreshCcw, Palette, Bell, Languages, CloudCog, History } from 'lucide-react';
import { BackupSettings, BackupSummary, SecuritySettings, UserPreferences } from '../types';

interface SystemCoreProps {
    exportData: () => void | Promise<void>;
    importData: (json: string) => void | Promise<void>;
    securitySettings: SecuritySettings;
    onUpdateSecurity: (partial: Partial<SecuritySettings>) => void;
    onSync: () => void;
    syncStatus?: string;
    preferences: UserPreferences;
    onUpdatePreferences: (partial: Partial<UserPreferences>) => void;
    backupSettings: BackupSettings;
    onUpdateBackupSettings: (partial: Partial<BackupSettings>) => void;
    backups: BackupSummary[];
    onCreateBackup: (label?: string) => void | Promise<void>;
    onRestoreBackup: (id: string) => void | Promise<void>;
    onDeleteBackup: (id: string) => void | Promise<void>;
}

const SystemCore: React.FC<SystemCoreProps> = ({
    exportData,
    importData,
    securitySettings,
    onUpdateSecurity,
    onSync,
    syncStatus,
    preferences,
    onUpdatePreferences,
    backupSettings,
    onUpdateBackupSettings,
    backups,
    onCreateBackup,
    onRestoreBackup,
    onDeleteBackup,
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'backup' | 'security'>('general');
    const [cloudEndpoint, setCloudEndpoint] = useState(securitySettings.cloudEndpoint);
    const [passphrase, setPassphrase] = useState(securitySettings.passphrase);
    const [intervalMinutes, setIntervalMinutes] = useState(backupSettings.intervalMinutes);
    const [retention, setRetention] = useState(backupSettings.retention);

    useEffect(() => {
        setCloudEndpoint(securitySettings.cloudEndpoint);
        setPassphrase(securitySettings.passphrase);
    }, [securitySettings]);

    useEffect(() => {
        setIntervalMinutes(backupSettings.intervalMinutes);
        setRetention(backupSettings.retention);
    }, [backupSettings]);

    const formattedBackups = useMemo(() => backups.map(b => ({
        ...b,
        humanDate: new Date(b.createdAt).toLocaleString(),
    })), [backups]);

    const handleImport = async () => {
        const json = prompt("Paste full JSON backup string here:");
        if (json) {
            try {
                await importData(json);
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
                        <div className="max-w-3xl space-y-6">
                            <h3 className="font-bold text-lg text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                <Palette size={18} /> Experience & Preferences
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Palette size={16} className="text-zinc-700" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Appearance</h4>
                                            <p className="text-xs text-zinc-500">Theme and density controls.</p>
                                        </div>
                                    </div>
                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Theme</label>
                                    <select
                                        value={preferences.appearance.theme}
                                        onChange={(e) => onUpdatePreferences({ appearance: { theme: e.target.value as any } })}
                                        className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm mb-3"
                                    >
                                        <option value="dark">Dark</option>
                                        <option value="light">Light</option>
                                        <option value="system">System</option>
                                    </select>

                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Density</label>
                                    <select
                                        value={preferences.appearance.density}
                                        onChange={(e) => onUpdatePreferences({ appearance: { density: e.target.value as any } })}
                                        className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm"
                                    >
                                        <option value="comfortable">Comfortable</option>
                                        <option value="compact">Compact</option>
                                    </select>
                                </div>

                                <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Languages size={16} className="text-zinc-700" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Localization</h4>
                                            <p className="text-xs text-zinc-500">Language and timezone preferences.</p>
                                        </div>
                                    </div>
                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Language</label>
                                    <input
                                        type="text"
                                        value={preferences.localization.language}
                                        onChange={(e) => onUpdatePreferences({ localization: { language: e.target.value } })}
                                        className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm mb-3"
                                        placeholder="en-US"
                                    />

                                    <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Timezone</label>
                                    <input
                                        type="text"
                                        value={preferences.localization.timezone}
                                        onChange={(e) => onUpdatePreferences({ localization: { timezone: e.target.value } })}
                                        className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm"
                                        placeholder="UTC"
                                    />
                                </div>
                            </div>

                            <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Bell size={16} className="text-zinc-700" />
                                    <div>
                                        <h4 className="font-semibold text-sm">Notifications</h4>
                                        <p className="text-xs text-zinc-500">Control alerting channels inside the workspace.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                                        <input
                                            type="checkbox"
                                            checked={preferences.notifications.alerts}
                                            onChange={(e) => onUpdatePreferences({ notifications: { alerts: e.target.checked } })}
                                        />
                                        Critical Alerts
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                                        <input
                                            type="checkbox"
                                            checked={preferences.notifications.maintenance}
                                            onChange={(e) => onUpdatePreferences({ notifications: { maintenance: e.target.checked } })}
                                        />
                                        Maintenance
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                                        <input
                                            type="checkbox"
                                            checked={preferences.notifications.digest}
                                            onChange={(e) => onUpdatePreferences({ notifications: { digest: e.target.checked } })}
                                        />
                                        Weekly Digest
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="max-w-4xl space-y-6">
                            <h3 className="font-bold text-lg text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                                <History size={18} /> Backup, History, & Restore
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <CloudCog size={18} className="text-zinc-700" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Scheduled Backups</h4>
                                            <p className="text-xs text-zinc-500">Interval and retention policy for IndexedDB snapshots.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 items-end">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Interval (minutes)</label>
                                            <input
                                                type="number"
                                                value={intervalMinutes}
                                                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                                                className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm"
                                                min={1}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Retention (versions)</label>
                                            <input
                                                type="number"
                                                value={retention}
                                                onChange={(e) => setRetention(Number(e.target.value))}
                                                className="w-full bg-white border border-zinc-300 rounded px-3 py-2 text-sm"
                                                min={1}
                                            />
                                        </div>
                                        <button
                                            onClick={() => onUpdateBackupSettings({ intervalMinutes, retention })}
                                            className="bg-zinc-900 text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-black transition-colors"
                                        >
                                            Apply Policy
                                        </button>
                                        <button
                                            onClick={() => onCreateBackup('Manual backup')}
                                            className="flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border border-zinc-200 bg-white hover:bg-zinc-100"
                                        >
                                            <Save size={16} /> Run Backup Now
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <RefreshCcw size={18} className="text-zinc-700" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Manual Import/Export</h4>
                                            <p className="text-xs text-zinc-500">Move state across air-gapped systems.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={exportData}
                                            className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 hover:bg-white transition-all flex flex-col items-center group text-center"
                                        >
                                            <Save size={20} className="text-zinc-400 group-hover:text-zinc-900 mb-1 transition-colors" />
                                            <span className="font-semibold text-sm">Export JSON</span>
                                            <span className="text-[11px] text-zinc-500">Encrypted with passphrase</span>
                                        </button>
                                        <button
                                            onClick={handleImport}
                                            className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 hover:border-zinc-400 hover:bg-white transition-all flex flex-col items-center group text-center"
                                        >
                                            <RefreshCcw size={20} className="text-zinc-400 group-hover:text-zinc-900 mb-1 transition-colors" />
                                            <span className="font-semibold text-sm">Import JSON</span>
                                            <span className="text-[11px] text-zinc-500">Paste or load existing dump</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-zinc-200 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <History size={18} className="text-zinc-700" />
                                        <div>
                                            <h4 className="font-semibold text-sm">Version History</h4>
                                            <p className="text-xs text-zinc-500">Restore any point-in-time snapshot.</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-zinc-500">{backups.length} stored</span>
                                </div>

                                {backups.length === 0 ? (
                                    <div className="text-sm text-zinc-500">No backups captured yet.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {formattedBackups.map(backup => (
                                            <div key={backup.id} className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg">
                                                <div>
                                                    <p className="font-semibold text-sm text-zinc-800">{backup.label || 'Snapshot'}</p>
                                                    <p className="text-xs text-zinc-500">{backup.humanDate} · {backup.encrypted ? 'Encrypted' : 'Plain'} · {Math.round(backup.size / 1024)}kb</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => onRestoreBackup(backup.id)}
                                                        className="px-3 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                                                    >
                                                        Restore
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteBackup(backup.id)}
                                                        className="px-3 py-1 text-xs rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                <label className="flex items-center gap-2 text-sm text-zinc-700">
                                    <input
                                        type="checkbox"
                                        checked={securitySettings.encryptCloudPayloads}
                                        onChange={(e) => onUpdateSecurity({ encryptCloudPayloads: e.target.checked })}
                                        className="rounded"
                                    />
                                    Encrypt payloads before upload
                                </label>
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
