/**
 * Dataverse JS SDK v1.0
 * Author: Marcos Leite
 * A lightweight, zero-dependency library to simplify Dataverse Web API interactions in Power Pages.
 */
const dataverse = {
    _getApiUrl: function() {
        return `${window.location.origin}/_api/`;
    },
    _fetch: async function(url, options = {}) {
        options.headers = { 'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0', ...options.headers };
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
            console.error("Dataverse SDK Error:", errorData);
            throw new Error(errorMessage);
        }
        if (response.status === 204) return true;
        if (response.status === 201) return response.headers.get("OData-EntityId");
        return response.json();
    },
    create: async function(entityLogicalName, data) {
        const url = this._getApiUrl() + entityLogicalName + "s";
        const options = { method: 'POST', body: JSON.stringify(data) };
        const recordUrl = await this._fetch(url, options);
        const guid = recordUrl.match(/\(([^)]+)\)/)[1];
        return guid;
    },
    retrieve: async function(entityLogicalName, id, options = {}) {
        let q = [];
        if (options.select) q.push(`$select=${options.select.join(',')}`);
        if (options.expand) q.push(`$expand=${options.expand}`);
        const url = `${this._getApiUrl()}${entityLogicalName}s(${id})${q.length > 0 ? '?' + q.join('&') : ''}`;
        return this._fetch(url, { method: 'GET' });
    },
    retrieveMultiple: async function(entityLogicalName, options = {}) {
        let q = [];
        if (options.select) q.push(`$select=${options.select.join(',')}`);
        if (options.filter) q.push(`$filter=${options.filter}`);
        if (options.orderby) q.push(`$orderby=${options.orderby}`);
        if (options.top) q.push(`$top=${options.top}`);
        if (options.expand) q.push(`$expand=${options.expand}`);
        const url = `${this._getApiUrl()}${entityLogicalName}s${q.length > 0 ? '?' + q.join('&') : ''}`;
        const result = await this._fetch(url, { method: 'GET' });
        return result.value;
    },
    update: async function(entityLogicalName, id, data) {
        const url = `${this._getApiUrl()}${entityLogicalName}s(${id})`;
        const options = { method: 'PATCH', body: JSON.stringify(data) };
        return this._fetch(url, options);
    },
    delete: async function(entityLogicalName, id) {
        const url = `${this._getApiUrl()}${entityLogicalName}s(${id})`;
        return this._fetch(url, { method: 'DELETE' });
    }
};

// Esta linha é essencial para que o 'import' funcione
export { dataverse };
