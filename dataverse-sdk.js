/**
 * Dataverse JS SDK v1.0 - Global Scope Version for External Loading
 * Author: Marcos Leite
 */
(function(window) {
    "use strict";
    // Se o SDK já foi carregado, não faz nada.
    if (window.dataverse) {
        return;
    }

    const dataverse = {
        _getApiUrl: function() { return `${window.location.origin}/_api/`; },
        _fetch: async function(url, options = {}) {
            options.headers = { 'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0', ...options.headers };
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Dataverse SDK - Raw Error Response:", errorText);
                throw new Error(`API request failed with status ${response.status}.`);
            }
            if (response.status === 204) return true;
            if (response.status === 201) return response.headers.get("OData-EntityId");
            return response.json();
        },
        // ... (todas as outras funções: create, retrieve, retrieveMultiple, update, delete, exatamente como as tínhamos) ...
         create: async function(e,t){const n=this._getApiUrl()+e+"s",o={method:"POST",body:JSON.stringify(t)};return(await this._fetch(n,o)).match(/\(([^)]+)\)/)[1]},retrieve:async function(e,t,n={}){let o=[];n.select&&o.push(`$select=${n.select.join(",")}`),n.expand&&o.push(`$expand=${n.expand}`);const a=`${this._getApiUrl()}${e}s(${t})${o.length>0?"?"+o.join("&"):""}`;return this._fetch(a,{method:"GET"})},retrieveMultiple:async function(e,t={}){let n=[];t.select&&n.push(`$select=${t.select.join(",")}`),t.filter&&n.push(`$filter=${t.filter}`),t.orderby&&n.push(`$orderby=${t.orderby}`),t.top&&n.push(`$top=${t.top}`),t.expand&&n.push(`$expand=${t.expand}`);const o=`${this._getApiUrl()}${e}s${n.length>0?"?"+n.join("&"):""}`;return(await this._fetch(o,{method:"GET"})).value},update:async function(e,t,n){const o=`${this._getApiUrl()}${e}s(${t})`,a={method:"PATCH",body:JSON.stringify(n)};return this._fetch(o,a)},delete:async function(e,t){const n=`${this._getApiUrl()}${e}s(${t})`;return this._fetch(n,{method:"DELETE"})}
    };

    // A linha chave: anexa o objeto 'dataverse' ao 'window' global.
    window.dataverse = dataverse;

})(window);
