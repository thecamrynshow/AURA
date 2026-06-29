/* PNEUOMA Discovery Engine — production config (load before /lib/discovery.js) */
(function () {
    'use strict';
    var host = window.location.hostname || '';
    var isProd =
        host === 'pneuoma.com' ||
        host === 'www.pneuoma.com' ||
        host.indexOf('.pneuoma.com') !== -1;

    if (!window.PNEUOMA_DISCOVERY_ENDPOINT) {
        window.PNEUOMA_DISCOVERY_ENDPOINT = isProd
            ? 'https://discovery.pneuoma.com/api/discovery/event'
            : 'http://localhost:3000/api/discovery/event';
    }
    if (!window.PNEUOMA_DISCOVERY_ENVIRONMENT) {
        window.PNEUOMA_DISCOVERY_ENVIRONMENT = isProd ? 'production' : 'local';
    }
})();
