'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-8e04.up.railway.app';

interface Role {
  name: string;
  description: string;
  permissions: string[];
}

interface AccessEntry {
  id: string;
  user_email: string;
  role: string;
  roleInfo: Role;
  granted_by?: string;
  created_at: string;
}

interface ShareLink {
  id: string;
  token: string;
  role: string;
  roleInfo: Role;
  name?: string;
  created_by?: string;
  expires_at?: string;
  max_uses?: number;
  use_count: number;
  is_active: boolean;
  created_at: string;
  isExpired: boolean;
  isMaxedOut: boolean;
}

interface AccessLogEntry {
  id: string;
  user_email?: string;
  share_token?: string;
  action: string;
  ip_address?: string;
  created_at: string;
  metadata: any;
}

export default function AccessControlPage() {
  const params = useParams();
  const router = useRouter();
  const productionId = params.id as string;

  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [accessList, setAccessList] = useState<AccessEntry[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');

  const [showCreateLink, setShowCreateLink] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkRole, setLinkRole] = useState('viewer');
  const [linkExpiry, setLinkExpiry] = useState('');
  const [linkMaxUses, setLinkMaxUses] = useState('');

  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'links' | 'log'>('users');

  useEffect(() => {
    loadData();
  }, [productionId]);

  const loadData = async () => {
    try {
      const [rolesRes, accessRes, linksRes, logRes] = await Promise.all([
        fetch(`${API_URL}/api/roles`),
        fetch(`${API_URL}/api/productions/${productionId}/access`),
        fetch(`${API_URL}/api/productions/${productionId}/share-links`),
        fetch(`${API_URL}/api/productions/${productionId}/access-log?limit=50`)
      ]);

      const [rolesData, accessData, linksData, logData] = await Promise.all([
        rolesRes.json(),
        accessRes.json(),
        linksRes.json(),
        logRes.json()
      ]);

      if (rolesData.success) setRoles(rolesData.data);
      if (accessData.success) setAccessList(accessData.data);
      if (linksData.success) setShareLinks(linksData.data);
      if (logData.success) setAccessLog(logData.data);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const grantAccess = async () => {
    if (!newUserEmail.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/productions/${productionId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
          grantedBy: 'current-user@example.com' // In production, use actual user
        })
      });
      const data = await response.json();
      if (data.success) {
        setAccessList(prev => [...prev.filter(a => a.user_email !== newUserEmail.toLowerCase()), {
          ...data.data,
          roleInfo: roles[data.data.role]
        }]);
        setNewUserEmail('');
        setShowAddUser(false);
      }
    } catch (err) {
      console.error('Error granting access:', err);
    }
  };

  const revokeAccess = async (email: string) => {
    if (!confirm(`Remove access for ${email}?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/productions/${productionId}/access/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success && data.revoked) {
        setAccessList(prev => prev.filter(a => a.user_email !== email));
      }
    } catch (err) {
      console.error('Error revoking access:', err);
    }
  };

  const createShareLink = async () => {
    try {
      const response = await fetch(`${API_URL}/api/productions/${productionId}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: linkName || null,
          role: linkRole,
          expiresIn: linkExpiry ? parseInt(linkExpiry) : null,
          maxUses: linkMaxUses ? parseInt(linkMaxUses) : null,
          createdBy: 'current-user@example.com'
        })
      });
      const data = await response.json();
      if (data.success) {
        setShareLinks(prev => [{ ...data.data, roleInfo: roles[data.data.role] }, ...prev]);
        setLinkName('');
        setLinkExpiry('');
        setLinkMaxUses('');
        setShowCreateLink(false);
      }
    } catch (err) {
      console.error('Error creating share link:', err);
    }
  };

  const deactivateLink = async (linkId: string) => {
    if (!confirm('Deactivate this share link?')) return;

    try {
      const response = await fetch(`${API_URL}/api/share-links/${linkId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setShareLinks(prev => prev.map(l => l.id === linkId ? { ...l, is_active: false } : l));
      }
    } catch (err) {
      console.error('Error deactivating link:', err);
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700';
      case 'editor': return 'bg-blue-100 text-blue-700';
      case 'viewer': return 'bg-gray-100 text-gray-700';
      case 'commenter': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading access settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/productions/${productionId}/budget`)}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            &#8592; Back to Budget
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Access Control</h1>
          <p className="text-gray-600 mt-1">
            Manage who can view and edit this budget
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {(['users', 'links', 'log'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'users' && `People (${accessList.length})`}
                {tab === 'links' && `Share Links (${shareLinks.filter(l => l.is_active).length})`}
                {tab === 'log' && 'Activity Log'}
              </button>
            ))}
          </nav>
        </div>

        {/* People Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">People with Access</h2>
              <button
                onClick={() => setShowAddUser(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Add Person
              </button>
            </div>

            {showAddUser && (
              <div className="p-4 bg-blue-50 border-b">
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Email address"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    {Object.entries(roles).map(([key, role]) => (
                      <option key={key} value={key}>{role.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={grantAccess}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y">
              {accessList.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No users have been granted access yet
                </div>
              ) : (
                accessList.map(entry => (
                  <div key={entry.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{entry.user_email}</div>
                      <div className="text-xs text-gray-500">
                        Added {formatDate(entry.created_at)}
                        {entry.granted_by && ` by ${entry.granted_by}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(entry.role)}`}>
                        {entry.roleInfo?.name || entry.role}
                      </span>
                      <button
                        onClick={() => revokeAccess(entry.user_email)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Share Links Tab */}
        {activeTab === 'links' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Share Links</h2>
              <button
                onClick={() => setShowCreateLink(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                + Create Link
              </button>
            </div>

            {showCreateLink && (
              <div className="p-4 bg-blue-50 border-b space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    placeholder="Link name (optional)"
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <select
                    value={linkRole}
                    onChange={(e) => setLinkRole(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    {Object.entries(roles).filter(([k]) => k !== 'owner').map(([key, role]) => (
                      <option key={key} value={key}>{role.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={linkExpiry}
                    onChange={(e) => setLinkExpiry(e.target.value)}
                    placeholder="Expires in (hours)"
                    className="border rounded px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={linkMaxUses}
                    onChange={(e) => setLinkMaxUses(e.target.value)}
                    placeholder="Max uses (optional)"
                    className="border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createShareLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Create Link
                  </button>
                  <button
                    onClick={() => setShowCreateLink(false)}
                    className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y">
              {shareLinks.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No share links created yet
                </div>
              ) : (
                shareLinks.map(link => (
                  <div key={link.id} className={`p-4 ${!link.is_active ? 'bg-gray-50 opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {link.name || 'Unnamed Link'}
                          {!link.is_active && <span className="ml-2 text-red-500 text-xs">(Deactivated)</span>}
                          {link.isExpired && <span className="ml-2 text-orange-500 text-xs">(Expired)</span>}
                          {link.isMaxedOut && <span className="ml-2 text-orange-500 text-xs">(Max uses reached)</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          <div>Created {formatDate(link.created_at)}</div>
                          <div>
                            Used {link.use_count} times
                            {link.max_uses && ` / ${link.max_uses} max`}
                          </div>
                          {link.expires_at && (
                            <div>Expires {formatDate(link.expires_at)}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(link.role)}`}>
                          {link.roleInfo?.name || link.role}
                        </span>
                        {link.is_active && (
                          <>
                            <button
                              onClick={() => copyLink(link.token)}
                              className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                            >
                              {copiedToken === link.token ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                              onClick={() => deactivateLink(link.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Deactivate
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'log' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Activity Log</h2>
            </div>
            <div className="divide-y">
              {accessLog.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No activity recorded yet
                </div>
              ) : (
                accessLog.map(entry => (
                  <div key={entry.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {entry.action.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entry.user_email || 'Anonymous'}
                          {entry.ip_address && ` from ${entry.ip_address}`}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(entry.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Role Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-medium text-gray-900 mb-3">Role Permissions</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(roles).map(([key, role]) => (
              <div key={key} className="border rounded p-3">
                <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${getRoleBadgeColor(key)}`}>
                  {role.name}
                </div>
                <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map(perm => (
                    <span key={perm} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
