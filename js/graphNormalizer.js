/**
 * Strudel Graph Normalization Engine
 * Implements the authoritative 7-step normalization pipeline
 * Converts arbitrary user graphs into single, ordered, valid Strudel expressions
 */

class GraphNormalizer {
    constructor(nodeSchema) {
        this.nodeSchema = nodeSchema;
        this.normalizationRules = {
            collapseRules: {
                "gain": "multiply",
                "speed": "multiply", 
                "pan": "last",
                "lpf": "last",
                "hpf": "last",
                "bpf": "last",
                "delay": "last"
            },
            neutralValues: {
                "gain": 1,
                "pan": 0,
                "delay": 0,
                "speed": 1,
                "lpf": 8000,
                "hpf": 20,
                "bpf": 1000
            },
            wrapperPolicy: "outermost"
        };
    }

    /**
     * Main normalization pipeline - 7 steps
     */
    normalizeGraph(nodes, connections) {
        try {
            // Step 1: Prune & Validate
            const prunedGraph = this.pruneAndValidate(nodes, connections);
            
            // Step 2: Linearize Chains
            const linearizedChains = this.linearizeChains(prunedGraph.nodes, prunedGraph.connections);
            
            // Step 3: Resolve Structural Merges
            const resolvedChains = this.resolveStructuralMerges(linearizedChains);
            
            // Step 4: Sort Effects by Stage
            const sortedChains = this.sortEffectsByStage(resolvedChains);
            
            // Step 5: Lift Wrapper Nodes
            const liftedChains = this.liftWrappers(sortedChains);
            
            // Step 6: Collapse Redundancies
            const collapsedChains = this.collapseRedundancies(liftedChains);
            
            // Step 7: Emit Canonical Code
            const canonicalResult = this.emitCanonicalCode(collapsedChains);
            
            return {
                success: true,
                code: canonicalResult.code,
                metadata: canonicalResult.metadata,
                chains: collapsedChains
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                code: "",
                metadata: null,
                chains: []
            };
        }
    }

    /**
     * Step 1: Prune & Validate
     * Remove disconnected nodes, enforce DAG, validate sources
     */
    pruneAndValidate(nodes, connections) {
        // Remove unreachable nodes
        const reachableNodes = this.findReachableNodes(nodes, connections);
        
        // Remove orphan control nodes (nodes with no connections)
        const connectedNodeIds = new Set();
        connections.forEach(conn => {
            connectedNodeIds.add(conn.sourceNodeId);
            connectedNodeIds.add(conn.targetNodeId);
        });
        
        const prunedNodes = nodes.filter(node => 
            reachableNodes.has(node.id) && connectedNodeIds.has(node.id)
        );
        
        // Validate DAG (no cycles)
        if (!this.isDAG(prunedNodes, connections)) {
            throw new Error("Graph contains cycles - must be a Directed Acyclic Graph");
        }
        
        // Validate single source per chain
        this.validateSingleSourcePerChain(prunedNodes, connections);
        
        return {
            nodes: prunedNodes,
            connections: connections.filter(conn => 
                prunedNodes.some(node => node.id === conn.sourceNodeId) &&
                prunedNodes.some(node => node.id === conn.targetNodeId)
            )
        };
    }

    /**
     * Step 2: Linearize Chains
     * Convert graph into execution paths
     */
    linearizeChains(nodes, connections) {
        const chains = [];
        const processedNodes = new Set();
        
        // Find root nodes (sources with no input connections)
        const rootNodes = this.findRootNodes(nodes, connections);
        
        rootNodes.forEach(rootNode => {
            if (!processedNodes.has(rootNode.id)) {
                const chain = this.buildLinearChain(rootNode, connections, processedNodes);
                if (chain.length > 0) {
                    chains.push(chain);
                }
            }
        });
        
        return chains;
    }

    /**
     * Step 3: Resolve Structural Merges
     * Handle stack, cat, sequence nodes with multiple inputs
     */
    resolveStructuralMerges(chains) {
        const resolvedChains = [];
        
        chains.forEach(chain => {
            const structuralNodes = chain.filter(node => {
                const nodeDef = this.nodeSchema.nodes[node.type];
                return nodeDef?.category === 'structural';
            });
            
            if (structuralNodes.length === 0) {
                resolvedChains.push(chain);
            } else {
                // Handle structural nodes by normalizing their inputs
                const processedChain = this.processStructuralNode(chain);
                resolvedChains.push(processedChain);
            }
        });
        
        return resolvedChains;
    }

    /**
     * Step 4: Sort Effects by Stage
     * Ignore UI order, use execution metadata
     */
    sortEffectsByStage(chains) {
        return chains.map(chain => {
            const sourceNode = chain[0];
            const effectNodes = chain.slice(1); // Skip source
            
            // Sort effect nodes by execution stage priority
            const sortedEffects = effectNodes.sort((a, b) => {
                const aStage = this.getExecutionStage(a);
                const bStage = this.getExecutionStage(b);
                return aStage - bStage;
            });
            
            return [sourceNode, ...sortedEffects];
        });
    }

    /**
     * Step 5: Lift Wrapper Nodes
     * Wrappers must be outermost
     */
    liftWrappers(chains) {
        return chains.map(chain => {
            const wrapperNodes = chain.filter(node => {
                const nodeDef = this.nodeSchema.nodes[node.type];
                return nodeDef?.execution?.wraps === true;
            });
            
            if (wrapperNodes.length === 0) {
                return chain;
            }
            
            // Find the last wrapper (outermost)
            const outermostWrapper = wrapperNodes[wrapperNodes.length - 1];
            const wrapperIndex = chain.indexOf(outermostWrapper);
            
            // Everything after the wrapper belongs inside
            const innerChain = chain.slice(0, wrapperIndex + 1);
            const outerChain = [outermostWrapper];
            
            return {
                type: 'wrapped',
                wrapper: outermostWrapper,
                innerChain: innerChain,
                outerChain: outerChain
            };
        });
    }

    /**
     * Step 6: Collapse Redundancies
     * Merge mergeable effects, remove neutral values
     */
    collapseRedundancies(chains) {
        return chains.map(chain => {
            if (chain.type === 'wrapped') {
                return {
                    ...chain,
                    innerChain: this.collapseEffectChain(chain.innerChain),
                    outerChain: this.collapseEffectChain(chain.outerChain)
                };
            } else {
                return this.collapseEffectChain(chain);
            }
        });
    }

    /**
     * Step 7: Emit Canonical Code
     * Generate final Strudel code with metadata
     */
    emitCanonicalCode(chains) {
        let code = "";
        const patterns = [];
        
        chains.forEach(chain => {
            if (chain.type === 'wrapped') {
                const wrapperCode = this.generateWrapperCode(chain.wrapper, chain.innerChain);
                patterns.push(wrapperCode);
            } else {
                const chainCode = this.generateChainCode(chain);
                patterns.push(chainCode);
            }
        });
        
        if (patterns.length === 1) {
            code = patterns[0];
        } else if (patterns.length > 1) {
            code = patterns.join(' ');
        }
        
        const metadata = {
            normalization: {
                inputChains: chains.length,
                outputPattern: code,
                rulesApplied: Object.keys(this.normalizationRules.collapseRules),
                timestamp: new Date().toISOString()
            }
        };
        
        return { code, metadata };
    }

    // Helper methods

    findReachableNodes(nodes, connections) {
        const reachable = new Set();
        const visited = new Set();
        
        const visit = (nodeId) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            reachable.add(nodeId);
            
            // Find connections from this node
            connections.forEach(conn => {
                if (conn.sourceNodeId === nodeId) {
                    visit(conn.targetNodeId);
                }
            });
        };
        
        // Start from all nodes and traverse
        nodes.forEach(node => visit(node.id));
        
        return reachable;
    }

    isDAG(nodes, connections) {
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycle = (nodeId) => {
            if (recursionStack.has(nodeId)) return true;
            if (visited.has(nodeId)) return false;
            
            visited.add(nodeId);
            recursionStack.add(nodeId);
            
            const outgoing = connections.filter(conn => conn.sourceNodeId === nodeId);
            for (const conn of outgoing) {
                if (hasCycle(conn.targetNodeId)) return true;
            }
            
            recursionStack.delete(nodeId);
            return false;
        };
        
        for (const node of nodes) {
            if (hasCycle(node.id)) return false;
        }
        
        return true;
    }

    validateSingleSourcePerChain(nodes, connections) {
        // Implementation for ensuring single source per chain
        // This is a simplified version - full implementation would be more complex
        const sourceNodes = nodes.filter(node => {
            const nodeDef = this.nodeSchema.nodes[node.type];
            return nodeDef?.category === 'source';
        });
        
        if (sourceNodes.length > 1) {
            // In a real implementation, we'd validate this per chain
            // For now, we'll allow multiple sources and let the linearization handle it
        }
    }

    findRootNodes(nodes, connections) {
        return nodes.filter(node => {
            return !connections.some(conn => conn.targetNodeId === node.id);
        });
    }

    buildLinearChain(rootNode, connections, processedNodes) {
        const chain = [rootNode];
        processedNodes.add(rootNode.id);
        
        let currentNode = rootNode;
        const visited = new Set([rootNode.id]);
        
        while (true) {
            // Find next node in chain
            const nextConnection = connections.find(conn => 
                conn.sourceNodeId === currentNode.id && 
                !visited.has(conn.targetNodeId)
            );
            
            if (!nextConnection) break;
            
            const nextNode = this.findNodeById(nodes, nextConnection.targetNodeId);
            if (!nextNode || visited.has(nextNode.id)) break;
            
            chain.push(nextNode);
            visited.add(nextNode.id);
            processedNodes.add(nextNode.id);
            currentNode = nextNode;
        }
        
        return chain;
    }

    findNodeById(nodes, id) {
        return nodes.find(node => node.id === id);
    }

    processStructuralNode(chain) {
        // Simplified structural node processing
        // In a full implementation, this would handle stack, cat, sequence specifically
        return chain;
    }

    getExecutionStage(node) {
        const nodeDef = this.nodeSchema.nodes[node.type];
        const stage = nodeDef?.execution?.stage;
        
        const stagePriorities = {
            'source': 10,
            'structural': 20,
            'rhythmic': 30,
            'pitch': 40,
            'modulation': 50,
            'spectral': 60,
            'space': 70,
            'wrapper': 80
        };
        
        return stagePriorities[stage] || 50;
    }

    collapseEffectChain(chain) {
        if (chain.length <= 1) return chain;
        
        const collapsed = [chain[0]]; // Keep source
        const effectProperties = {};
        
        // Collect all effect properties
        chain.slice(1).forEach(node => {
            const props = node.properties?.strudelProperties || {};
            Object.keys(props).forEach(key => {
                if (this.normalizationRules.collapseRules[key]) {
                    if (!effectProperties[key]) {
                        effectProperties[key] = [];
                    }
                    effectProperties[key].push(props[key]);
                }
            });
        });
        
        // Apply collapse rules
        Object.keys(effectProperties).forEach(key => {
            const rule = this.normalizationRules.collapseRules[key];
            const values = effectProperties[key];
            
            if (rule === 'multiply' && values.length > 1) {
                // Multiply gain/speed values
                const result = values.reduce((acc, val) => acc * val, 1);
                effectProperties[key] = [result];
            } else if (rule === 'last') {
                // Keep last value
                effectProperties[key] = [values[values.length - 1]];
            }
        });
        
        // Remove neutral values
        Object.keys(this.normalizationRules.neutralValues).forEach(key => {
            const neutralValue = this.normalizationRules.neutralValues[key];
            if (effectProperties[key] && 
                effectProperties[key].length === 1 && 
                effectProperties[key][0] === neutralValue) {
                delete effectProperties[key];
            }
        });
        
        // Create collapsed effect node if needed
        if (Object.keys(effectProperties).length > 0) {
            const collapsedNode = {
                ...chain[chain.length - 1],
                properties: {
                    ...chain[chain.length - 1].properties,
                    strudelProperties: {
                        ...chain[chain.length - 1].properties?.strudelProperties,
                        ...effectProperties
                    }
                }
            };
            collapsed.push(collapsedNode);
        }
        
        return collapsed;
    }

    generateWrapperCode(wrapperNode, innerChain) {
        const innerCode = this.generateChainCode(innerChain);
        const wrapperType = wrapperNode.type.toLowerCase();
        
        return `${wrapperType}(${innerCode})`;
    }

    generateChainCode(chain) {
        if (chain.length === 0) return '';
        
        // Start with source node
        let code = this.buildNodePattern(chain[0]);
        
        // Apply effects in order
        for (let i = 1; i < chain.length; i++) {
            const effectCode = this.buildNodePattern(chain[i]);
            if (effectCode) {
                code = `${effectCode}(${code})`;
            }
        }
        
        return code;
    }

    buildNodePattern(node) {
        // This should integrate with the existing buildNodePattern method
        // For now, return a basic implementation
        const props = node.properties?.strudelProperties || {};
        
        if (node.type === 'Instrument') {
            const sound = props.sound || 'bd';
            return `s("${sound}")`;
        } else if (node.type === 'DrumSymbol') {
            const symbol = props.symbol || 'bd';
            return `s("${symbol}")`;
        } else if (this.nodeSchema.nodes[node.type]) {
            const nodeDef = this.nodeSchema.nodes[node.type];
            const method = nodeDef.id.toLowerCase();
            const arg = Object.values(props)[0] || 0.5;
            return `.${method}(${arg})`;
        }
        
        return '';
    }
}