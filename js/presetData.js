// JSON remains the source of truth. Direct file previews use its generated script bundle.
(function () {
    let bundleRequest;
    function loadLocalBundle() {
        if (window.PIXELSONG_PRESET_DATA) return Promise.resolve(window.PIXELSONG_PRESET_DATA);
        if (!bundleRequest) {
            bundleRequest = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = new URL('data/presetBundle.js', document.baseURI).href;
                script.onload = () => {
                    if (window.PIXELSONG_PRESET_DATA) resolve(window.PIXELSONG_PRESET_DATA);
                    else { bundleRequest = null; reject(new Error('The local song data is missing. Rebuild the preset data and refresh the app.')); }
                };
                script.onerror = () => {
                    script.remove();
                    bundleRequest = null;
                    reject(new Error('Could not open the local song data. Keep the data folder beside index.html, then refresh the app.'));
                };
                document.head.appendChild(script);
            });
        }
        return bundleRequest;
    }

    window.loadPresetData = async function (path) {
        if (!/^data\/(songs|tune-helper)\/[a-z0-9_-]+\.json$/.test(path)) throw new Error('Unknown preset data path.');
        if (window.location.protocol === 'file:') {
            const bundle = await loadLocalBundle();
            if (!Object.prototype.hasOwnProperty.call(bundle, path)) throw new Error('This arrangement is missing from the local song data.');
            return structuredClone(bundle[path]);
        }
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error('Preset file unavailable.');
            return await response.json();
        } catch (error) {
            throw new Error('Could not load the song data. Check your connection and try again.');
        }
    };
})();
