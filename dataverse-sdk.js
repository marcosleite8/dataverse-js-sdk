/**
 * Dataverse JS SDK v1.0
 * Author: Marcos Leite
 * A lightweight, zero-dependency library to simplify Dataverse Web API interactions in Power Pages and other web applications.
 */

const dataverse = {
    /**
     * Internal function to get the base API URL from the current portal's context.
     * @returns {string} The base URL for the Dataverse Web API.
     */
    _getApiUrl: function() {
        // In Power Pages, the API is exposed under /_api/
        if (window.location.pathname.includes("/_services/")) { // Check if running in portal context
            return `${window.location.origin}/_api/`;
        }
        // Fallback for other web apps or different environments
        return `${window.location.origin}/api/data/v9.2/`;
    },

    /**
     * Internal function to handle the fetch request and response.
     * @param {string} url - The full API endpoint URL.
     * @param {object} options - The fetch options (method, headers, body).
     * @returns {Promise<any>} The JSON response from the API.
     */
    _fetch: async function(url, options = {}) {
        options.headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            ...options.headers,
        };

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
            console.error("Dataverse SDK Error:", errorData);
            throw new Error(errorMessage);
        }

        if (response.status === 204) { // No Content success
            return true;
        }

        // For create, the location of the new record is in the headers
        if (response.status === 201) { 
            return response.headers.get("OData-EntityId");
        }

        return response.json();
    },

    /**
     * Creates a new record in a Dataverse table.
     * @param {string} entityLogicalName - The logical name of the entity (e.g., "contact").
     * @param {object} data - An object containing the data for the new record.
     * @returns {Promise<string>} A promise that resolves with the GUID of the newly created record.
     */
    create: async function(entityLogicalName, data) {
        const url = this._getApiUrl() + entityLogicalName + "s";
        const options = {
            method: 'POST',
            body: JSON.stringify(data),
        };
        const recordUrl = await this._fetch(url, options);
        const guid = recordUrl.match(/\(([^)]+)\)/)[1];
        return guid;
    },

    /**
     * Retrieves a single record by its ID.
     * @param {string} entityLogicalName - The logical name of the entity.
     * @param {string} id - The GUID of the record to retrieve.
     * @param {object} [options] - OData query options ($select, $expand).
     * @returns {Promise<object>} A promise that resolves with the record data.
     */
    retrieve: async function(entityLogicalName, id, options = {}) {
        let queryString = [];
        if (options.select) queryString.push(`$select=${options.select.join(',')}`);
        if (options.expand) queryString.push(`$expand=${options.expand}`);
        
        const url = `${this._getApiUrl()}${entityLogicalName}s(${id})${queryString.length > 0 ? '?' + queryString.join('&') : ''}`;
        return this._fetch(url, { method: 'GET' });
    },

    /**
     * Retrieves multiple records from a Dataverse table with OData query options.
     * @param {string} entityLogicalName - The logical name of the entity.
     * @param {object} [options] - OData query options ($select, $filter, $orderby, $top, $expand).
     * @returns {Promise<Array<object>>} A promise that resolves with an array of records.
     */
    retrieveMultiple: async function(entityLogicalName, options = {}) {
        let queryString = [];
        if (options.select) queryString.push(`$select=${options.select.join(',')}`);
        if (options.filter) queryString.push(`$filter=${options.filter}`);
        if (options.orderby) queryString.push(`$orderby=${options.orderby}`);
        if (options.top) queryString.push(`$top=${options.top}`);
        if (options.expand) queryString.push(`$expand=${options.expand}`);
        
        const url = `${this._getApiUrl()}${entityLogicalName}s${queryString.length > 0 ? '?' + queryString.join('&') : ''}`;
        const result = await this._fetch(url, { method: 'GET' });
        return result.value;
    },

    /**
     * Updates an existing record in a Dataverse table.
     * @param {string} entityLogicalName - The logical name of the entity.
     * @param {string} id - The GUID of the record to update.
     * @param {object} data - An object containing the data to update.
     * @returns {Promise<boolean>} A promise that resolves to true on successful update.
     */
    update: async function(entityLogicalName, id, data) {
        const url = `${this._getApiUrl()}${entityLogicalName}s(${id})`;
        const options = {
            method: 'PATCH',
            body: JSON.stringify(data),
        };
        return this._fetch(url, options);
    },

    /**
     * Deletes a record from a Dataverse table.
     * @param {string} entityLogicalName - The logical name of the entity.
     * @param {string} id - The GUID of the record to delete.
     * @returns {Promise<boolean>} A promise that resolves to true on successful deletion.
     */
    delete: async function(entityLogicalName, id) {
        const url = `${this._getApiUrl()}${entityLogicalName}s(${id})`;
        return this._fetch(url, { method: 'DELETE' });
    }
};

export { dataverse };