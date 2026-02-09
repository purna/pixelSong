// layerManager.js - Manage multiple sound layers + UI rendering with group/folder functionality

class LayerManager {
    constructor(app) {
        this.app = app;
        this.layers = [];
        this.folders = []; // Array to store folder objects
        this.nextLayerId = 1;
        this.selectedLayerId = null;
        this.dragSource = null; // Track dragged item
        this.dragType = null; // 'layer' or 'folder'
        this.dragTarget = null; // Track drop target for reordering
    }

    init() {
        this.addLayer('Layer 1');
        this.selectLayer(1); // Select the first layer
        this.renderList(); // Initial render
        this.initFolderUI(); // Initialize folder UI

        // Listen for collection changes to update the layers panel
        document.addEventListener('collectionChanged', () => {
            this.renderList();
        });
    }

    // Initialize folder management UI
    initFolderUI() {
        // Folder controls are now in the HTML, just add event listeners
        // Add event listeners for folder controls
        document.getElementById('add-group-btn')?.addEventListener('click', () => {
            // Automatically create a new group with a default name
            const groupNumber = this.app.collectionManager.getCurrentCollection()?.groups?.length + 1 || 1;
            const groupName = `Group ${groupNumber}`;
            this.app.collectionManager.addGroupToCurrentCollection(groupName);
        });
        document.getElementById('expand-all-btn')?.addEventListener('click', () => this.expandCollapseAll(true));
        document.getElementById('collapse-all-btn')?.addEventListener('click', () => this.expandCollapseAll(false));
    }

    addLayer(name = null) {
        const layerName = name || `Layer ${this.nextLayerId}`;
        const layer = {
            id: `layer-${Date.now()}-${this.nextLayerId++}`,
            name: layerName,
            settings: { ...this.app.getDefaultSettings() },
            muted: false,
            solo: false,
            volume: 1.0,
            startTime: 0,
            fadeIn: 0,
            fadeOut: 0,
            color: this.generateRandomColor()
        };

        this.layers.push(layer);
        this.selectedLayerId = layer.id;

        // Automatically add new layers to the current collection
        const currentCollection = this.app.collectionManager?.getCurrentCollection();
        if (currentCollection) {
            this.app.collectionManager.addLayerToCollection(currentCollection.id, layer);
        }

        this.notifyLayerChange();
        return layer;
    }

    // Add layer with specific ID (used when loading from collections)
    addLayerWithId(name, layerId) {
        const layer = {
            id: layerId,
            name: name || `Layer ${this.nextLayerId}`,
            settings: { ...this.app.getDefaultSettings() },
            muted: false,
            solo: false,
            volume: 1.0,
            startTime: 0,
            fadeIn: 0,
            fadeOut: 0,
            color: this.generateRandomColor()
        };

        this.layers.push(layer);
        this.selectedLayerId = layer.id;

        // Don't automatically add to collection - it will be added by the caller
        // Note: We don't increment nextLayerId here since we're using a specific ID
        this.notifyLayerChange();
        return layer;
    }

    // NEW: Duplicate layer functionality
    duplicateLayer(sourceLayer) {
        const layer = {
            id: `layer-${Date.now()}-${this.nextLayerId++}`,
            name: sourceLayer.name + ' Copy',
            settings: { ...sourceLayer.settings },
            muted: sourceLayer.muted,
            solo: false, // Don't duplicate solo state
            volume: sourceLayer.volume,
            startTime: sourceLayer.startTime + 0.5, // Offset slightly
            fadeIn: sourceLayer.fadeIn,
            fadeOut: sourceLayer.fadeOut,
            color: this.generateRandomColor()
        };

        this.layers.push(layer);
        this.selectedLayerId = layer.id;

        // Automatically add duplicated layer to current collection
        const currentCollection = this.app.collectionManager?.getCurrentCollection();
        if (currentCollection) {
            this.app.collectionManager.addLayerToCollection(currentCollection.id, layer);
        }

        // Update app settings and UI to reflect the new layer
        this.app.currentSettings = { ...layer.settings };
        if (this.app.ui) {
            this.app.ui.updateDisplay(layer.settings);
        }

        this.notifyLayerChange();
        return layer;
    }

    removeLayer(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index === -1) return;

        if (this.layers.length <= 1) {
            this.app.notifications.showNotification('Cannot delete the last layer', 'error');
            return;
        }

        if (!confirm(`Delete layer "${this.layers[index].name}"?`)) return;

        this.layers.splice(index, 1);

        // FAILSAFE: Always ensure at least one layer exists
        if (this.layers.length === 0) {
            this.addLayer('Layer 1');
            return;
        }

        // Select another layer if we deleted the selected one
        if (this.selectedLayerId === layerId) {
            const newSelectedLayer = this.layers[Math.min(index, this.layers.length - 1)];
            this.selectLayer(newSelectedLayer.id);
        }

        // Remove from current collection as well
        const currentCollection = this.app.collectionManager?.getCurrentCollection();
        if (currentCollection) {
            this.app.collectionManager.removeLayerFromCollection(currentCollection.id, layerId);
        }

        this.notifyLayerChange();
    }

    getLayer(layerId) {
        return this.layers.find(l => l.id === layerId);
    }

    getSelectedLayer() {
        return this.getLayer(this.selectedLayerId);
    }

    selectLayer(layerId) {
        const layer = this.getLayer(layerId);
        if (layer) {
            this.selectedLayerId = layerId;
            
            // ALWAYS update app settings and UI when selecting a layer
            this.app.currentSettings = { ...layer.settings };
            if (this.app.ui) {
                this.app.ui.updateDisplay(layer.settings);
            }
            
            this.notifyLayerChange();
        }
    }

    updateLayer(layerId, updates) {
        const layer = this.getLayer(layerId);
        if (layer) {
            Object.assign(layer, updates);
            // Sync changes back to collection storage
            if (this.app.collectionManager) {
                const currentCollection = this.app.collectionManager.getCurrentCollection();
                if (currentCollection) {
                    this.app.collectionManager.syncLayerToCollection(currentCollection.id, layerId);
                }
            }

            this.notifyLayerChange();
        }
    }
    updateLayerSettings(layerId, settings) {
        const layer = this.getLayer(layerId);
        if (layer) {
            layer.settings = { ...layer.settings, ...settings };

            // If this is the selected layer, update the app and UI immediately
            if (layerId === this.selectedLayerId) {
                this.app.currentSettings = { ...layer.settings };
                if (this.app.ui) {
                    this.app.ui.updateDisplay(layer.settings);
                }
            }

            // Sync changes back to collection storage
            if (this.app.collectionManager) {
                const currentCollection = this.app.collectionManager.getCurrentCollection();
                if (currentCollection) {
                    this.app.collectionManager.syncLayerToCollection(currentCollection.id, layerId);
                }
            }

            this.notifyLayerChange();
        }
    }

    // Folder Management Methods
    addFolder(name = 'New Folder') {
        const folder = {
            id: `folder-${Date.now()}`,
            name: name,
            layers: [],
            expanded: true
        };
        this.folders.push(folder);
        this.renderList();
    }

    expandCollapseAll(expand) {
        // Check if we're showing collection groups or legacy folders
        const currentCollection = this.app.collectionManager?.getCurrentCollection();
        const showCollectionGroups = currentCollection && currentCollection.groups && currentCollection.groups.length > 0;

        if (showCollectionGroups) {
            // Use collection manager for groups
            this.app.collectionManager.expandCollapseAllGroups(currentCollection.id, expand);
        } else {
            // Use legacy folder system
            this.folders.forEach(folder => {
                folder.expanded = expand;
            });
            this.renderList();
        }
    }

    addLayerToFolder(folderId, layer) {
        const folder = this.folders.find(f => f.id === folderId);
        if (folder) {
            folder.layers.push(layer);
            // Remove from main layers array if it exists there
            const idx = this.layers.indexOf(layer);
            if (idx > -1) {
                this.layers.splice(idx, 1);
            }
        }
        this.renderList();
    }

    removeLayerFromFolder(folderId, layer) {
        const folder = this.folders.find(f => f.id === folderId);
        if (folder) {
            const idx = folder.layers.indexOf(layer);
            if (idx > -1) {
                folder.layers.splice(idx, 1);
                // Add back to main layers array
                this.layers.push(layer);
            }
        }
        this.renderList();
    }

    getAllLayers() {
        let allLayers = [...this.layers];
        this.folders.forEach(folder => {
            allLayers = [...allLayers, ...folder.layers];
        });
        return allLayers;
    }

    deleteFolder(folderId) {
        const folderIndex = this.folders.findIndex(f => f.id === folderId);
        if (folderIndex === -1) return;

        // Move all layers from folder back to main list
        const folder = this.folders[folderIndex];
        folder.layers.forEach(layer => {
            this.layers.push(layer);
        });

        // Remove folder
        this.folders.splice(folderIndex, 1);
        this.renderList();
    }

    renameLayer(layerId, newName) {
        if (!newName || newName.trim() === '') return;
        const layer = this.getLayer(layerId);
        if (layer) {
            layer.name = newName.trim();
            // Sync changes back to collection storage
            if (this.app.collectionManager) {
                const currentCollection = this.app.collectionManager.getCurrentCollection();
                if (currentCollection) {
                    this.app.collectionManager.syncLayerToCollection(currentCollection.id, layerId);
                }
            }
            this.notifyLayerChange();
        }
    }

    toggleMute(layerId) {
        const layer = this.getLayer(layerId);
        if (layer) {
            layer.muted = !layer.muted;
            // Sync changes back to collection storage
            if (this.app.collectionManager) {
                const currentCollection = this.app.collectionManager.getCurrentCollection();
                if (currentCollection) {
                    this.app.collectionManager.syncLayerToCollection(currentCollection.id, layerId);
                }
            }
            this.notifyLayerChange();
        }
    }

    toggleSolo(layerId) {
        const layer = this.getLayer(layerId);
        if (layer) {
            layer.solo = !layer.solo;
            // Sync changes back to collection storage
            if (this.app.collectionManager) {
                const currentCollection = this.app.collectionManager.getCurrentCollection();
                if (currentCollection) {
                    this.app.collectionManager.syncLayerToCollection(currentCollection.id, layerId);
                }
            }
            this.notifyLayerChange();
        }
    }

    setLayerVolume(layerId, volume) {
        const layer = this.getLayer(layerId);
        if (layer) {
            layer.volume = Math.max(0, Math.min(1, volume));
            // Sync changes back to collection storage
            if (this.app.collectionManager) {
                const currentCollection = this.app.collectionManager.getCurrentCollection();
                if (currentCollection) {
                    this.app.collectionManager.syncLayerToCollection(currentCollection.id, layerId);
                }
            }

            this.notifyLayerChange();
        }
    }

    // NEW: Update only layer volume (for true per-layer volume control)
    updateLayer(layerId, updates) {
        const layer = this.getLayer(layerId);
        if (layer) {
            Object.assign(layer, updates);
            // Sync changes back to collection storage
            if (this.app.collectionManager) {
                const currentCollection = this.app.collectionManager.getCurrentCollection();
                if (currentCollection) {
                    this.app.collectionManager.syncLayerToCollection(currentCollection.id, layerId);
                }
            }

            this.notifyLayerChange();
        }
    }
    moveLayer(layerId, direction) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index === -1) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < this.layers.length) {
            [this.layers[index], this.layers[newIndex]] = [this.layers[newIndex], this.layers[index]];
            this.notifyLayerChange();
        }
    }

    generateRandomColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 60%)`;
    }

    getActiveLayers() {
        const hasSolo = this.layers.some(l => l.solo);
        return this.layers.filter(layer => {
            if (hasSolo) return layer.solo;
            return !layer.muted;
        });
    }

    generateLayerBuffers() {
        const activeLayers = this.getActiveLayers();
        const buffers = [];
        const volumes = [];

        for (const layer of activeLayers) {
            const buffer = this.app.soundGenerator.generate(
                layer.settings,
                this.app.audioEngine.sampleRate
            );
            buffers.push(buffer);
            volumes.push(layer.volume);
        }

        return { buffers, volumes };
    }

    async playAllLayers() {
        const activeLayers = this.getActiveLayers();
        if (activeLayers.length === 0) return;

        // Ensure AudioContext is resumed before playing
        await this.app.audioEngine.ensureContextResumed();
        
        // Add delay for browser audio policies
        await new Promise(resolve => setTimeout(resolve, 100));
    
        this.app.audioEngine.stopAll(); // Clear any ongoing playback
        
        // Calculate the total duration including start times and fades
        let maxEndTime = 0;
        activeLayers.forEach(layer => {
            const duration = this.app.soundGenerator.calculateDuration(layer.settings);
            const endTime = layer.startTime + duration + (layer.fadeOut || 0);
            maxEndTime = Math.max(maxEndTime, endTime);
        });
        
        console.log('Playing', activeLayers.length, 'layers, total duration:', maxEndTime, 'seconds');
    
        activeLayers.forEach(layer => {
            const buffer = this.app.soundGenerator.generate(layer.settings, this.app.audioEngine.sampleRate);
            
            // Ensure audio context is available
            if (!this.app.audioEngine.context) {
                console.warn('AudioContext not initialized, skipping layer playback');
                return;
            }
            
            const source = this.app.audioEngine.context.createBufferSource();
            source.buffer = buffer;
    
            // Create gain node for volume and fades
            const gainNode = this.app.audioEngine.context.createGain();
            gainNode.gain.value = layer.volume;
            source.connect(gainNode);
            gainNode.connect(this.app.audioEngine.context.destination);
    
            // Apply fades (linear ramp)
            if (layer.fadeIn > 0) {
                gainNode.gain.setValueAtTime(0, this.app.audioEngine.context.currentTime + layer.startTime);
                gainNode.gain.linearRampToValueAtTime(layer.volume, this.app.audioEngine.context.currentTime + layer.startTime + layer.fadeIn);
            }
            if (layer.fadeOut > 0) {
                const duration = this.app.soundGenerator.calculateDuration(layer.settings);
                gainNode.gain.setValueAtTime(layer.volume, this.app.audioEngine.context.currentTime + layer.startTime + duration - layer.fadeOut);
                gainNode.gain.linearRampToValueAtTime(0, this.app.audioEngine.context.currentTime + layer.startTime + duration);
            }
    
            // Schedule start
            source.start(this.app.audioEngine.context.currentTime + layer.startTime);
        });
        
        // Stop timeline playback when all sounds finish
        setTimeout(() => {
            if (this.app.timeline.isPlaying) {
                this.app.timeline.stopPlayback();
            }
        }, (maxEndTime + 0.5) * 1000); // Add 0.5s buffer
    }

    exportMixedAudio(filename = 'mixed_sfx.wav') {
        try {
            const activeLayers = this.getActiveLayers();
            if (activeLayers.length === 0) {
                this.app.notifications.showNotification('No active layers to export!', 'error');
                return;
            }

            console.log('Exporting mixed audio with', activeLayers.length, 'layers');
    
            const buffers = [];
            const volumes = [];
            const offsets = [];
            const sampleRate = this.app.audioEngine.sampleRate;
    
            for (const layer of activeLayers) {
                const buffer = this.app.soundGenerator.generate(layer.settings, sampleRate);
                buffers.push(buffer);
                volumes.push(layer.volume);
                offsets.push(Math.floor(layer.startTime * sampleRate)); // Samples offset
            }
    
            const mixedBuffer = this.app.audioEngine.mixBuffers(buffers, volumes, offsets);
            this.app.audioEngine.downloadWAV(mixedBuffer, filename);
        } catch (error) {
            console.error('Error exporting mixed audio:', error);
            this.app.notifications.showNotification('Error exporting mixed audio: ' + error.message, 'error');
        }
    }

    getState() {
        return {
            layers: this.layers.map(l => ({ ...l })),
            nextLayerId: this.nextLayerId,
            selectedLayerId: this.selectedLayerId
        };
    }

    setState(state) {
        this.layers = state.layers.map(l => ({ ...l }));
        this.nextLayerId = state.nextLayerId;
        this.selectedLayerId = state.selectedLayerId;

        if (this.selectedLayerId) {
            const layer = this.getLayer(this.selectedLayerId);
            if (layer) this.app.updateSettings(layer.settings);
        }

        this.notifyLayerChange();
    }

    clearAllLayers() {
        // Clear all layers but preserve nextLayerId counter
        // This is used when switching collections to load collection-specific layers
        this.layers = [];
        this.selectedLayerId = null;
        this.notifyLayerChange();
    }

    notifyLayerChange() {
        this.renderList(); // Now handled internally
        const event = new CustomEvent('layersChanged', {
            detail: { layers: this.layers, selectedId: this.selectedLayerId }
        });
        document.dispatchEvent(event);
    }

    // ────────────────────────────────────────────────────────────────
    // UI: Render Layer List with Groups/Folders (like Pixel3D scene objects)
    // ────────────────────────────────────────────────────────────────
    renderList() {
        const list = document.getElementById('layersList');
        if (!list) return;

        list.innerHTML = '';

        // Get current collection groups if collections are enabled
        const currentCollection = this.app.collectionManager?.getCurrentCollection();
        const showCollectionGroups = currentCollection && currentCollection.groups && currentCollection.groups.length > 0;

        if (showCollectionGroups) {
            // Render groups from current collection
            currentCollection.groups.forEach(group => {
                const folderEl = document.createElement('div');
                folderEl.className = 'layer-folder-item';
                folderEl.dataset.folderId = group.id;

                folderEl.innerHTML = `
                    <div class="folder-header" draggable="true">
                        <i class="fas ${group.expanded ? 'fa-folder-open' : 'fa-folder'} folder-icon"></i>
                        <input type="text" class="folder-name" value="${group.name}">
                        <div class="folder-actions">
                            <i class="fas fa-trash folder-delete-btn" title="Delete Folder"></i>
                            <i class="fas ${group.expanded ? 'fa-chevron-up' : 'fa-chevron-down'} folder-toggle-btn" title="${group.expanded ? 'Collapse' : 'Expand'}"></i>
                        </div>
                    </div>
                    <div class="folder-contents" style="display: ${group.expanded ? 'block' : 'none'};">
                    </div>
                `;

                // Add folder header events
                const header = folderEl.querySelector('.folder-header');
                const toggleBtn = folderEl.querySelector('.folder-toggle-btn');
                const deleteBtn = folderEl.querySelector('.folder-delete-btn');
                const nameInput = folderEl.querySelector('.folder-name');

                // Toggle folder expansion
                header.addEventListener('click', (e) => {
                    if (e.target === nameInput || e.target === toggleBtn || e.target === deleteBtn) return;
                    group.expanded = !group.expanded;
                    this.renderList();
                });

                // Toggle button
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    group.expanded = !group.expanded;
                    this.renderList();
                });

                // Delete folder
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.collectionManager.deleteGroup(currentCollection.id, group.id);
                });

                // Rename folder
                nameInput.addEventListener('change', (e) => {
                    this.app.collectionManager.renameGroup(currentCollection.id, group.id, e.target.value);
                });
                nameInput.addEventListener('click', (e) => e.stopPropagation());

                // Make folder header a drop target
                header.addEventListener('dragover', (e) => this.handleDragOver(e));
                header.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                header.addEventListener('drop', (e) => this.handleDropOnCollectionGroup(e, currentCollection.id, group.id));

                // Render folder contents
                const contentsEl = folderEl.querySelector('.folder-contents');
                // Use layerIds for new architecture, fallback to layers for legacy
                const layerIds = group.layerIds || group.layers || [];
                layerIds.forEach(layerId => {
                    const layer = this.getLayer(layerId);
                    if (layer) {
                        this.renderLayerInFolder(layer, contentsEl, group.id);
                    }
                });

                list.appendChild(folderEl);
            });
        } else {
            // Fallback to original folder system if no collection groups
            this.folders.forEach(folder => {
                const folderEl = document.createElement('div');
                folderEl.className = 'layer-folder-item';
                folderEl.dataset.folderId = folder.id;

                folderEl.innerHTML = `
                    <div class="folder-header" draggable="true">
                        <i class="fas ${folder.expanded ? 'fa-folder-open' : 'fa-folder'} folder-icon"></i>
                        <input type="text" class="folder-name" value="${folder.name}">
                        <div class="folder-actions">
                            <i class="fas fa-trash folder-delete-btn" title="Delete Folder"></i>
                            <i class="fas ${folder.expanded ? 'fa-chevron-up' : 'fa-chevron-down'} folder-toggle-btn" title="${folder.expanded ? 'Collapse' : 'Expand'}"></i>
                        </div>
                    </div>
                    <div class="folder-contents" style="display: ${folder.expanded ? 'block' : 'none'};">
                    </div>
                `;

                // Add folder header events
                const header = folderEl.querySelector('.folder-header');
                const toggleBtn = folderEl.querySelector('.folder-toggle-btn');
                const deleteBtn = folderEl.querySelector('.folder-delete-btn');
                const nameInput = folderEl.querySelector('.folder-name');

                // Toggle folder expansion
                header.addEventListener('click', (e) => {
                    if (e.target === nameInput || e.target === toggleBtn || e.target === deleteBtn) return;
                    folder.expanded = !folder.expanded;
                    this.renderList();
                });

                // Toggle button
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    folder.expanded = !folder.expanded;
                    this.renderList();
                });

                // Delete folder
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteFolder(folder.id);
                });

                // Rename folder
                nameInput.addEventListener('change', (e) => {
                    folder.name = e.target.value;
                });
                nameInput.addEventListener('click', (e) => e.stopPropagation());

                // Make folder header a drop target
                header.addEventListener('dragover', (e) => this.handleDragOver(e));
                header.addEventListener('dragleave', (e) => this.handleDragLeave(e));
                header.addEventListener('drop', (e) => this.handleDropOnFolder(e, folder.id));

                // Render folder contents
                const contentsEl = folderEl.querySelector('.folder-contents');
                folder.layers.forEach(layer => {
                    this.renderLayerInFolder(layer, contentsEl, folder.id);
                });

                list.appendChild(folderEl);
            });
        }

        // Render layers not in folders/groups
        // When using collection groups, show layers that aren't in any group
        if (!showCollectionGroups) {
            // Legacy folder system - show all layers not in folders
            this.layers.forEach(layer => {
                this.renderLayerInFolder(layer, list, null);
            });
        } else {
            // Collection groups system - show layers that aren't in any group
            const currentCollection = this.app.collectionManager?.getCurrentCollection();
            if (currentCollection) {
                // Find layers that are in the collection but not in any group
                this.layers.forEach(layer => {
                    // Check if this layer is in any group
                    const isInGroup = currentCollection.groups.some(group =>
                        (group.layerIds || group.layers || []).includes(layer.id)
                    );

                    // Only render if not in any group
                    if (!isInGroup) {
                        this.renderLayerInFolder(layer, list, null);
                    }
                });
            }
        }
    }

    // Render a layer in a specific container (folder or main list)
    renderLayerInFolder(layer, container, folderId) {
        const layerDiv = document.createElement('div');
        layerDiv.className = `layer-item ${layer.id === this.selectedLayerId ? 'active' : ''}`;
        layerDiv.draggable = true;
        layerDiv.dataset.folderId = folderId || 'main';
        layerDiv.dataset.layerId = layer.id;

        // Mute / Visibility toggle
        const muteBtn = document.createElement('i');
        muteBtn.className = `fas fa-eye${layer.muted ? '-slash' : ''} layer-vis-btn ${layer.muted ? 'hidden-layer' : ''}`;
        muteBtn.title = layer.muted ? 'Unmute layer' : 'Mute layer';
        muteBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMute(layer.id);
        };

        // Layer name (editable)
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'layer-name-input';
        nameInput.value = layer.name;
        nameInput.onclick = e => e.stopPropagation();
        nameInput.onblur = () => this.renameLayer(layer.id, nameInput.value.trim() || 'Layer');
        nameInput.onkeydown = e => {
            if (e.key === 'Enter') nameInput.blur();
        };

        // Action buttons container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'layer-actions';
        actionsContainer.onclick = e => e.stopPropagation();

        // Duplicate button
        const dupBtn = document.createElement('i');
        dupBtn.className = 'fas fa-copy';
        dupBtn.style.color = 'var(--accent-tertiary)';
        dupBtn.style.fontSize = '12px';
        dupBtn.title = 'Duplicate layer';
        dupBtn.onclick = (e) => {
            e.stopPropagation();
            this.app.saveUndoState();
            this.duplicateLayer(layer);
            this.app.notifications.showNotification('Layer duplicated', 'success');
        };

        // Add to folder / Remove from folder button
        const folderBtn = document.createElement('i');
        if (folderId) {
            // Check if this is a collection group
            const currentCollection = this.app.collectionManager?.getCurrentCollection();
            const isCollectionGroup = currentCollection?.groups?.some(g => g.id === folderId);

            if (isCollectionGroup) {
                folderBtn.className = 'fas fa-folder-minus layer-btn remove-from-folder';
                folderBtn.title = 'Remove from Group';
                folderBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.app.collectionManager.removeLayerFromGroup(currentCollection.id, folderId, layer.id);
                };
            } else {
                folderBtn.className = 'fas fa-folder-minus layer-btn remove-from-folder';
                folderBtn.title = 'Remove from Folder';
                folderBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.removeLayerFromFolder(folderId, layer);
                };
            }
        } else {
            folderBtn.className = 'fas fa-folder-plus layer-btn add-to-folder';
            folderBtn.title = 'Add to Folder';
            folderBtn.onclick = (e) => {
                e.stopPropagation();
                this.showFolderSelection(layer);
            };
        }

        // Delete button
        const delBtn = document.createElement('i');
        delBtn.className = 'fas fa-trash';
        delBtn.style.color = '#f44336';
        delBtn.style.fontSize = '12px';
        delBtn.title = 'Delete layer';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            this.app.saveUndoState();
            this.removeLayer(layer.id);
        };

        actionsContainer.appendChild(dupBtn);
        actionsContainer.appendChild(folderBtn);
        actionsContainer.appendChild(delBtn);

        layerDiv.appendChild(muteBtn);
        layerDiv.appendChild(nameInput);
        layerDiv.appendChild(actionsContainer);

        // Drag start
        layerDiv.addEventListener('dragstart', (e) => {
            // Find the original index safely
            let originalIndex = -1;
            if (folderId) {
                // Check if this is a collection group first
                const currentCollection = this.app.collectionManager?.getCurrentCollection();
                const isCollectionGroup = currentCollection?.groups?.some(g => g.id === folderId);
    
                if (isCollectionGroup) {
                    // Find in collection group (use layerIds for new architecture)
                    const group = currentCollection.groups.find(g => g.id === folderId);
                    if (group) {
                        originalIndex = (group.layerIds || group.layers || []).indexOf(layer.id);
                    }
                } else {
                    // Find in legacy folder
                    const folder = this.folders.find(f => f.id === folderId);
                    if (folder) {
                        originalIndex = folder.layers.indexOf(layer);
                    }
                }
            } else {
                // Find in main layers
                originalIndex = this.layers.indexOf(layer);
            }

            this.dragSource = {
                element: layerDiv,
                layer: layer,
                folderId: folderId,
                originalIndex: originalIndex
            };
            this.dragType = 'layer';
            e.dataTransfer.setData('text/plain', 'drag-layer');
            e.dataTransfer.effectAllowed = 'move';
            layerDiv.classList.add('dragging');
        });

        // Drag end
        layerDiv.addEventListener('dragend', (e) => {
            layerDiv.classList.remove('dragging');
            this.dragSource = null;
            this.dragType = null;
            this.dragTarget = null;
        });

        // Drag over for reordering
        layerDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver(e);

            // Find the target index safely
            let targetIndex = -1;
            if (folderId) {
                // Check if this is a collection group first
                const currentCollection = this.app.collectionManager?.getCurrentCollection();
                const isCollectionGroup = currentCollection?.groups?.some(g => g.id === folderId);
    
                if (isCollectionGroup) {
                    // Find in collection group (use layerIds for new architecture)
                    const group = currentCollection.groups.find(g => g.id === folderId);
                    if (group) {
                        targetIndex = (group.layerIds || group.layers || []).indexOf(layer.id);
                    }
                } else {
                    // Find in legacy folder
                    const folder = this.folders.find(f => f.id === folderId);
                    if (folder) {
                        targetIndex = folder.layers.indexOf(layer);
                    }
                }
            } else {
                // Find in main layers
                targetIndex = this.layers.indexOf(layer);
            }

            this.dragTarget = {
                element: layerDiv,
                folderId: folderId,
                index: targetIndex
            };
        });

        // Drag leave
        layerDiv.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e);
            if (this.dragTarget?.element === layerDiv) {
                this.dragTarget = null;
            }
        });

        // Drop on layer for reordering
        layerDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDragLeave(e);
            if (this.dragSource && this.dragTarget && this.dragSource.layer !== this.dragTarget.layer) {
                this.handleDropOnLayer(e);
            }
        });

        // Select layer (clicking the row, but not inputs/buttons)
        layerDiv.onclick = (e) => {
            if (e.target.tagName === 'I' || e.target.tagName === 'INPUT') return;
            this.selectLayer(layer.id);
        };

        container.appendChild(layerDiv);
    }

/**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        // Handle folder drop targets
        const folderHeader = e.target.closest('.folder-header');
        if (folderHeader) {
            // Remove previous drop targets from layers only
            const previousLayerDropTargets = document.querySelectorAll('.layer-item.drag-over');
            previousLayerDropTargets.forEach(el => el.classList.remove('drag-over'));

            // Remove drag-over from other folders
            const previousFolderDropTargets = document.querySelectorAll('.folder-header.drag-over');
            previousFolderDropTargets.forEach(el => {
                if (el !== folderHeader) {
                    el.classList.remove('drag-over');
                }
            });

            // Add drag-over class to folder header
            folderHeader.classList.add('drag-over');
            
            // Store the target folder ID
            const folderItem = folderHeader.closest('.layer-folder-item');
            if (folderItem) {
                this.dragState.targetFolderId = folderItem.dataset.folderId;
            }
            return;
        }

        // Handle layer drop targets
        const targetElement = e.target.closest('.layer-item');
        if (!targetElement || targetElement === this.dragState.draggedElement) {
            // Remove folder drag-over if we're not over a folder anymore
            const previousFolderDropTargets = document.querySelectorAll('.folder-header.drag-over');
            previousFolderDropTargets.forEach(el => el.classList.remove('drag-over'));
            return;
        }

        // Remove previous drop targets
        const previousLayerDropTarget = UI.layersList.querySelector('.layer-item.drag-over');
        if (previousLayerDropTarget) {
            previousLayerDropTarget.classList.remove('drag-over');
        }
        const previousFolderDropTargets = document.querySelectorAll('.folder-header.drag-over');
        previousFolderDropTargets.forEach(el => el.classList.remove('drag-over'));

        // Add drag-over class to new target
        targetElement.classList.add('drag-over');
        this.dragState.dropIndex = parseInt(targetElement.dataset.index);
        this.dragState.targetFolderId = null; // Not dropping on a folder
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('drag-over')) {
            e.target.classList.remove('drag-over');
        }
    }

    handleDropOnFolder(e, folderId) {
        e.preventDefault();
        e.stopPropagation();

        // Remove drag-over class
        if (e.target.classList.contains('drag-over')) {
            e.target.classList.remove('drag-over');
        }

        if (!this.dragSource || this.dragType !== 'layer') return;

        // Move layer to this folder
        this.addLayerToFolder(folderId, this.dragSource.layer);
    }

    handleDropOnCollectionGroup(e, collectionId, groupId) {
        e.preventDefault();
        e.stopPropagation();

        // Remove drag-over class
        if (e.target.classList.contains('drag-over')) {
            e.target.classList.remove('drag-over');
        }

        if (!this.dragSource || this.dragType !== 'layer') return;

        // Move layer to this collection group
        this.app.collectionManager.addLayerToGroup(collectionId, groupId, this.dragSource.layer.id);
    }

    handleDropOnLayer(e) {
        e.preventDefault();
        e.stopPropagation();

        // Remove drag-over class
        if (e.target.classList.contains('drag-over')) {
            e.target.classList.remove('drag-over');
        }

        if (!this.dragSource || !this.dragTarget) return;

        const sourceLayer = this.dragSource.layer;
        const targetLayer = this.dragTarget.layer;

        // Same folder or both in main list
        if (this.dragSource.folderId === this.dragTarget.folderId) {
            this.reorderLayersInSameContainer(this.dragSource, this.dragTarget);
        }
        // Different containers - move from one to another
        else {
            this.moveLayerBetweenContainers(this.dragSource, this.dragTarget);
        }
    }

    // Reorder layers within the same container (folder or main list)
    reorderLayersInSameContainer(source, target) {
        const containerId = source.folderId;
        const isFolder = containerId && containerId !== 'main';
        const container = isFolder
            ? this.folders.find(f => f.id === containerId)
            : { layers: this.layers };

        if (!container || !container.layers) return;

        // Remove source layer
        if (container.layers) {
            container.layers.splice(source.originalIndex, 1);
            // Insert at target position
            const insertIndex = target.index > source.originalIndex ? target.index - 1 : target.index;
            container.layers.splice(insertIndex, 0, source.layer);
        }

        this.renderList();
    }

    // Move layer between different containers (folder to folder, folder to main, etc.)
    moveLayerBetweenContainers(source, target) {
        const sourceIsFolder = source.folderId && source.folderId !== 'main';
        const targetIsFolder = target.folderId && target.folderId !== 'main';

        // Remove from source container
        if (sourceIsFolder) {
            const sourceFolder = this.folders.find(f => f.id === source.folderId);
            if (sourceFolder) {
                sourceFolder.layers.splice(source.originalIndex, 1);
            }
        } else {
            this.layers.splice(source.originalIndex, 1);
        }

        // Add to target container at the target position
        if (targetIsFolder) {
            const targetFolder = this.folders.find(f => f.id === target.folderId);
            if (targetFolder) {
                targetFolder.layers.splice(target.index, 0, source.layer);
            }
        } else {
            this.layers.splice(target.index, 0, source.layer);
        }

        this.renderList();
    }

    // Show folder selection dialog for adding layer to folder
    showFolderSelection(layer) {
        // Create a simple dropdown to select folder
        const existingDropdown = document.getElementById('folder-select-dropdown');
        if (existingDropdown) existingDropdown.remove();

        const dropdown = document.createElement('div');
        dropdown.id = 'folder-select-dropdown';
        dropdown.className = 'folder-select-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-header">Select Folder</div>
            ${this.folders.map(folder => `
                <div class="dropdown-item" data-folder-id="${folder.id}">${folder.name}</div>
            `).join('')}
            <div class="dropdown-item new-folder-item">+ New Folder</div>
        `;

        // Position near the layer
        const layerElement = document.querySelector(`.layer-item[data-layer-id="${layer.id}"]`);
        if (layerElement) {
            const rect = layerElement.getBoundingClientRect();
            dropdown.style.position = 'absolute';
            dropdown.style.left = `${rect.right + 10}px`;
            dropdown.style.top = `${rect.top}px`;
            document.body.appendChild(dropdown);

            // Add event listeners
            dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (item.classList.contains('new-folder-item')) {
                        const folderName = prompt('Enter folder name:', 'New Folder');
                        if (folderName) {
                            this.addFolder(folderName);
                            this.addLayerToFolder(this.folders[this.folders.length - 1].id, layer);
                        }
                    } else {
                        const folderId = item.dataset.folderId;
                        this.addLayerToFolder(folderId, layer);
                    }
                    dropdown.remove();
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function closeDropdown(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            });
        }
    }
}