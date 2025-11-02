/**
 * Dataverse JS SDK v1.1 - Global Scope Version for External Loading
 * Author: Marcos Leite
 * Description: A lightweight, zero-dependency library to simplify Dataverse Web API interactions.
 * This version attaches itself to the global 'window' object to avoid module loading issues.
 */
(function(window) {
    "use strict";

    // If the SDK has already been loaded, do not load it again.
    if (window.dataverse) {
        return;
    }

    const dataverse = {
        /**
         * Internal function to get the base API URL for Power Pages.
         * @returns {string} The base URL for the Power Pages Web API.
         */
        _getApiUrl: function() {
            return `${window.location.origin}/_api/`;
        },

        /**
         * Internal function to handle the fetch request, headers, and error handling.
         * @param {string} url - The full API endpoint URL.
         * @param {object} options - The fetch options (method, headers, body).
         * @returns {Promise<any>} The JSON response from the API or a success indicator.
         */
        _fetch: async function(url, options = {}) {
            options.headers = {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                ...options.headers
            };

            const response = await fetch(url, options);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Dataverse SDK - Raw Error Response:", errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error?.message || `API request failed with status ${response.status}.`);
                } catch (e) {
                    throw new Error(`API request failed with status ${response.status}. See console for raw response.`);
                }
            }

            if (response.status === 204) return true; // Success with No Content (Update, Delete)
            if (response.status === 201) return response.headers.get("OData-EntityId"); // Success with Create
            return response.json(); // Success with data (Retrieve, RetrieveMultiple)
        },

        /**
         * Creates a new record in a Dataverse table.
         * @param {string} entityLogicalName - The logical name of the table (e.g., "contact").
         * @param {object} data - An object containing the data for the new record.
         * @returns {Promise<string>} A promise that resolves with the GUID of the newly created record.
         */
        create: async function(entityLogicalName, data) {
            const url = this._getApiUrl() + entityLogicalName + "s";
            const options = { method: 'POST', body: JSON.stringify(data) };
            const recordUrl = await this._fetch(url, options);
            const guid = recordUrl.match(/\(([^)]+)\)/)[1];
            return guid;
        },
        
        /**
         * Retrieves a single record by its ID.
         * @param {string} entityLogicalName - The logical name of the table.
         * @param {string} id - The GUID of the record to retrieve.
         * @param {object} [options] - OData query options ($select, $expand).
         * @returns {Promise<object>} A promise that resolves with the record data.
         */
        retrieve: async function(entityLogicalName, id, options = {}) {
            let q = [];
            if (options.select) q.push(`$select=${options.select.join(',')}`);
            if (options.expand) q.push(`$expand=${options.expand}`);
            const url = `${this._getApiUrl()}${entityLogicalName}s(${id})${q.length > 0 ? '?' + q.join('&') : ''}`;
            return this._fetch(url, { method: 'GET' });
        },

        /**
         * Retrieves multiple records from a Dataverse table with OData query options.
         * @param {string} entityLogicalName - The logical name of the table.
         * @param {object} [options] - OData query options ($select, $filter, $orderby, $top, $expand).
         * @returns {Promise<Array<object>>} A promise that resolves with an array of records.
         */
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

        /**
         * Updates an existing record in a Dataverse table.
         * @param {string} entityLogicalName - The logical name of the table.
         * @param {string} id - The GUID of the record to update.
         * @param {object} data - An object containing the data to update.
         * @returns {Promise<boolean>} A promise that resolves to true on successful update.
         */
        update: async function(entityLogicalName, id, data) {
            const url = `${this._getApiUrl()}${entityLogicalName}s(${id})`;
            const options = { method: 'PATCH', body: JSON.stringify(data) };
            return this._fetch(url, options);
        },

        /**
         * Deletes a record from a Dataverse table.
         * @param {string} entityLogicalName - The logical name of the table.
         * @param {string} id - The GUID of the record to delete.
         * @returns {Promise<boolean>} A promise that resolves to true on successful deletion.
         */
        delete: async function(entityLogicalName, id) {
            const url = `${this._getApiUrl()}${entityLogicalName}s(${id})`;
            return this._fetch(url, { method: 'DELETE' });
        }
    };

    // Attach the dataverse object to the global window object
    window.dataverse = dataverse;

})(window);


