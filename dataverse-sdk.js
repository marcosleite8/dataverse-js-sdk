/**
 * Dataverse JS SDK v1.2 - Anti-Forgery Token Support
 * Author: Marcos Leite
 * Description: Adds support for Power Pages anti-forgery tokens on write operations.
 */
(function(window) {
    "use strict";
    if (window.dataverse) return;

    const dataverse = {
        _getApiUrl: function() { return `${window.location.origin}/_api/`; },
        
        // --- INÍCIO DA ALTERAÇÃO ---
        _fetch: async function(url, options = {}) {
            // Função auxiliar para ir buscar o token da página
            function getRequestVerificationToken() {
                return document.querySelector("#__RequestVerificationToken")?.value;
            }

            options.headers = {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
                'OData-MaxVersion': '4.0',
                'OData-Version': '4.0',
                ...options.headers
            };

            // Se for uma operação de escrita (POST, PATCH, DELETE), adiciona o token
            if (options.method === 'POST' || options.method === 'PATCH' || options.method === 'DELETE') {
                const token = getRequestVerificationToken();
                if (token) {
                    options.headers['__RequestVerificationToken'] = token;
                } else {
                    console.warn("Anti-forgery token not found. Write operations may fail.");
                }
            }
            // --- FIM DA ALTERAÇÃO ---

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
            if (response.status === 204) return true;
            if (response.status === 201) return response.headers.get("OData-EntityId");
            return response.json();
        },
        // ... (o resto das funções: create, retrieve, etc. continuam EXATAMENTE IGUAIS)
        create: async function(e,t){const n=this._getApiUrl()+e+"s",o={method:"POST",body:JSON.stringify(t)};return(await this._fetch(n,o)).match(/\(([^)]+)\)/)[1]},retrieve:async function(e,t,n={}){let o=[];n.select&&o.push(`$select=${n.select.join(",")}`),n.expand&&o.push(`$expand=${n.expand}`);const a=`${this._getApiUrl()}${e}s(${t})${o.length>0?"?"+o.join("&"):""}`;return this._fetch(a,{method:"GET"})},retrieveMultiple:async function(e,t={}){let n=[];t.select&&n.push(`$select=${t.select.join(",")}`),t.filter&&n.push(`$filter=${t.filter}`),t.orderby&&n.push(`$orderby=${t.orderby}`),t.top&&n.push(`$top=${t.top}`),t.expand&&n.push(`$expand=${t.expand}`);const o=`${this._getApiUrl()}${e}s${n.length>0?"?"+n.join("&"):""}`;return(await this._fetch(o,{method:"GET"})).value},update:async function(e,t,n){const o=`${this._getApiUrl()}${e}s(${t})`,a={method:"PATCH",body:JSON.stringify(n)};return this._fetch(o,a)},delete:async function(e,t){const n=`${this._getApiUrl()}${e}s(${t})`;return this._fetch(n,{method:"DELETE"})}
    };

    window.dataverse = dataverse;
})(window);

