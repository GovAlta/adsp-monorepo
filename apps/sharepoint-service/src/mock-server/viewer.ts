import { MockState } from './state';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

export function renderViewer(state: MockState): string {
  const { apps, sites } = state.snapshot();
  const appRows = apps
    .map(
      (app) =>
        `<tr><td>${escapeHtml(app.tenantId)}</td><td>${escapeHtml(app.clientId)}</td><td>${escapeHtml(app.secret)}</td><td>${escapeHtml(app.expiresAt)}</td></tr>`,
    )
    .join('');
  const siteSections = sites
    .map((site) => {
      const grants = site.grants.map((grant) => `${escapeHtml(grant.clientId)} (${grant.role})`).join(', ') || 'none';
      const lists = site.lists
        .map((list) => {
          const headers = ['id', ...list.columns.map((column) => column.name)];
          const rows = list.items
            .map(
              (item) =>
                `<tr>${headers.map((h) => `<td>${escapeHtml(h === 'id' ? item.id : item.fields[h])}</td>`).join('')}</tr>`,
            )
            .join('');
          return `<h3>${escapeHtml(list.displayName)} <small>${escapeHtml(list.listId)}</small></h3>
<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
<tbody>${rows || `<tr><td colspan="${headers.length}">No items</td></tr>`}</tbody></table>`;
        })
        .join('');
      return `<section><h2>${escapeHtml(site.displayName)}</h2><p>Site ID: <code>${escapeHtml(site.siteId)}</code><br/>Grants: ${grants}</p>${lists}</section>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="3"/>
<title>SharePoint mock server</title>
<style>body{font-family:sans-serif;margin:2rem}table{border-collapse:collapse;margin-bottom:1rem}td,th{border:1px solid #ccc;padding:4px 8px;text-align:left}small{color:#666}</style>
</head><body><h1>SharePoint mock server</h1>
<h2>App registrations (mock only)</h2>
<table><thead><tr><th>Entra tenant ID</th><th>Client ID</th><th>Secret</th><th>Expires</th></tr></thead><tbody>${appRows}</tbody></table>
${siteSections}</body></html>`;
}
