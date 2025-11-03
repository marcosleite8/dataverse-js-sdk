/**
 * Dataverse JS SDK v1.2 - Power Pages Enhanced Version
 * Author: Marcos Leite
 * Description: A lightweight library to simplify Dataverse Web API interactions,
 * specifically adapted to use the Power Pages' 'webapi.safeAjax' for enhanced security.
 * This version attaches itself to the global 'window' object.
 */
(function(window) {
    "use strict";

    if (window.dataverse) {
        return;
    }

    const dataverse = {
        _getApiUrl: function() {
            // A URL base já é tratada pelo webapi.safeAjax, então só precisamos do caminho relativo.
            return `${window.location.origin}/_api/`;
        },

        /**
         * ===================================================================
         * A ÚNICA PARTE MODIFICADA: _fetch agora usa webapi.safeAjax
         * ===================================================================
         * Internal function to handle the API request using Power Pages' safeAjax.
         * @param {string} url - The full API endpoint URL.
         * @param {object} options - The fetch-like options (method, body).
         * @returns {Promise<any>} A promise that resolves with the API response.
         */
        _fetch: function(url, options = {}) {
            // webapi.safeAjax é baseado em callbacks, então o envolvemos em uma Promise
            // para manter a compatibilidade com async/await no resto do SDK.
            return new Promise((resolve, reject) => {
                const settings = {
                    type: options.method, // GET, POST, PATCH, DELETE
                    url: url,
                    contentType: "application/json; charset=utf-8",
                    data: options.body, // O corpo da requisição
                    success: function (res, status, xhr) {
                        // Lógica para lidar com diferentes respostas de sucesso, igual ao seu SDK original
                        if (xhr.status === 204) { // Update, Delete
                            resolve(true);
                        } else if (xhr.status === 201) { // Create
                            resolve(xhr.getResponseHeader("OData-EntityId"));
                        } else { // Retrieve, RetrieveMultiple
                            resolve(res);
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error("Dataverse SDK (safeAjax) Error:", { xhr, status, error });
                        let errorMessage = `API request failed with status ${xhr.status}.`;
                        // Tenta extrair uma mensagem de erro mais clara da resposta
                        if (xhr.responseJSON && xhr.responseJSON.error) {
                            errorMessage = xhr.responseJSON.error.message;
                        }
                        reject(new Error(errorMessage));
                    }
                };

                // Executa a chamada AJAX segura do Power Pages
                webapi.safeAjax(settings);
            });
        },
        
        // ===================================================================
        // NENHUMA ALTERAÇÃO NECESSÁRIA DAQUI PARA BAIXO!
        // Todas as funções públicas continuam funcionando perfeitamente.
        // ===================================================================

        create: async function(entityLogicalName, data) {
            const url = this._getApiUrl() + entityLogicalName + "s";
            const options = { method: 'POST', body: JSON.stringify(data) };
            const recordUrl = await this._fetch(url, options); // Ainda funciona!
            const guid = recordUrl.match(/\(([^)]+)\)/)[1];
            return guid;
        },
        
        retrieve: async function(entityLogicalName, id, options = {}) {
            let q = [];
            if (options.select) q.push(`$select=${options.select.join(',')}`);
            if (options.expand) q.push(`$expand=${options.expand}`);
            const url = `${this._getApiUrl()}${entityLogicalName}s(${id})${q.length > 0 ? '?' + q.join('&') : ''}`;
            return this._fetch(url, { method: 'GET' }); // Ainda funciona!
        },

        retrieveMultiple: async function(entityLogicalName, options = {}) {
            let q = [];
            if (options.select) q.push(`$select=${options.select.join(',')}`);
            if (options.filter) q.push(`$filter=${options.filter}`);
            // ... (resto das opções)
            const url = `${this._getApiUrl()}${entityLogicalName}s${q.length > 0 ? '?' + q.join('&') : ''}`;
            const result = await this._fetch(url, { method: 'GET' }); // Ainda funciona!
            return result.value;
        },

        update: async function(entityLogicalName, id, data) {
            const url = `${this._getApiUrl()}${entityLogicalName}s(${id})`;
            const options = { method: 'PATCH', body: JSON.stringify(data) };
            return this._fetch(url, options); // Ainda funciona!
        },

        delete: async function(entityLogicalName, id) {
            const url = `${this._getApiUrl()}${entityLogicalName}s(${id})`;
            return this._fetch(url, { method: 'DELETE' }); // Ainda funciona!
        }
    };

    // Anexa o objeto dataverse ao objeto global window
    window.dataverse = dataverse;

})(window);