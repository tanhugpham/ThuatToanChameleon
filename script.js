// Chameleon Clustering Algorithm Implementation
class ChameleonClustering {
    constructor(k, minClusterSize) {
        this.k = k;
        this.minClusterSize = minClusterSize;
        this.data = [];
        this.clusters = [];
    }

    // Calculate Euclidean distance between two points
    euclideanDistance(point1, point2) {
        return Math.sqrt(
            Object.keys(point1).reduce((sum, key) => {
                if (key !== 'id' && key !== 'cluster') {
                    const val1 = parseFloat(point1[key]);
                    const val2 = parseFloat(point2[key]);
                    return sum + Math.pow(val1 - val2, 2);
                }
                return sum;
            }, 0)
        );
    }

    // Find k-nearest neighbors for each point
    findKNearestNeighbors(point, points) {
        return points
            .filter(p => p.id !== point.id)
            .map(p => ({
                id: p.id,
                distance: this.euclideanDistance(point, p)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, this.k);
    }

    // Build the k-nearest neighbor graph
    buildKNNGraph() {
        this.graph = new Map();
        this.data.forEach(point => {
            const neighbors = this.findKNearestNeighbors(point, this.data);
            this.graph.set(point.id, neighbors);
        });
    }

    // Calculate relative interconnectivity between clusters
    calculateRelativeInterconnectivity(cluster1, cluster2) {
        let connections = 0;
        let totalWeight = 0;

        cluster1.forEach(point1 => {
            const neighbors = this.graph.get(point1.id);
            neighbors.forEach(neighbor => {
                if (cluster2.some(p => p.id === neighbor.id)) {
                    connections++;
                    totalWeight += 1 / neighbor.distance;
                }
            });
        });

        return connections > 0 ? totalWeight / connections : 0;
    }

    // Calculate relative closeness between clusters
    calculateRelativeCloseness(cluster1, cluster2) {
        let totalDistance = 0;
        let count = 0;

        cluster1.forEach(point1 => {
            cluster2.forEach(point2 => {
                totalDistance += this.euclideanDistance(point1, point2);
                count++;
            });
        });

        return count > 0 ? 1 / (totalDistance / count) : 0;
    }

    // Merge clusters based on similarity
    mergeClusters() {
        while (true) {
            let maxSimilarity = 0;
            let clustersToMerge = null;

            for (let i = 0; i < this.clusters.length; i++) {
                for (let j = i + 1; j < this.clusters.length; j++) {
                    const interconnectivity = this.calculateRelativeInterconnectivity(
                        this.clusters[i],
                        this.clusters[j]
                    );
                    const closeness = this.calculateRelativeCloseness(
                        this.clusters[i],
                        this.clusters[j]
                    );
                    const similarity = interconnectivity * Math.pow(closeness, 2);

                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                        clustersToMerge = [i, j];
                    }
                }
            }

            if (!clustersToMerge || maxSimilarity < 0.1) break;

            const [i, j] = clustersToMerge;
            this.clusters[i] = [...this.clusters[i], ...this.clusters[j]];
            this.clusters.splice(j, 1);
        }
    }

    // Main clustering function
    cluster(data) {
        this.data = data.map((point, index) => ({
            ...point,
            id: index,
            cluster: index
        }));

        // Initialize each point as its own cluster
        this.clusters = this.data.map(point => [point]);

        // Build the k-nearest neighbor graph
        this.buildKNNGraph();

        // Merge clusters iteratively
        this.mergeClusters();

        // Assign cluster labels to points
        this.clusters.forEach((cluster, clusterIndex) => {
            cluster.forEach(point => {
                const dataPoint = this.data.find(p => p.id === point.id);
                if (dataPoint) {
                    dataPoint.cluster = clusterIndex;
                }
            });
        });

        return this.data;
    }
}

// UI and Visualization Handler
class ChameleonUI {
    constructor() {
        this.setupEventListeners();
        this.width = 800;
        this.height = 400;
        this.margin = { top: 40, right: 40, bottom: 40, left: 40 };
    }

    setupEventListeners() {
        document.getElementById('csvFile').addEventListener('change', this.handleFileUpload.bind(this));
        document.getElementById('startClustering').addEventListener('click', this.startClustering.bind(this));

        // Thêm dữ liệu mẫu có sẵn
        this.addSampleDataButtons();
    }

    addSampleDataButtons() {
        const sampleData = {
            'mau_don_gian': [
                {x: 2, y: 3}, {x: 5, y: 4}, {x: 3, y: 5}, {x: 6, y: 3}, {x: 2, y: 6},
                {x: 7, y: 5}, {x: 8, y: 2}, {x: 9, y: 3}, {x: 1, y: 1}, {x: 4, y: 1}
            ],
            'khach_hang': [
                {thu_nhap: 25000, chi_tieu: 15000}, {thu_nhap: 27000, chi_tieu: 16000},
                {thu_nhap: 24000, chi_tieu: 14500}, {thu_nhap: 26000, chi_tieu: 15500},
                {thu_nhap: 28000, chi_tieu: 16500}, {thu_nhap: 55000, chi_tieu: 45000},
                {thu_nhap: 58000, chi_tieu: 47000}, {thu_nhap: 52000, chi_tieu: 44000},
                {thu_nhap: 54000, chi_tieu: 46000}, {thu_nhap: 56000, chi_tieu: 48000}
            ],
            'phuc_tap': [
                {x: 1.2, y: 2.3}, {x: 1.5, y: 2.1}, {x: 1.3, y: 2.4}, {x: 1.4, y: 2.2},
                {x: 1.6, y: 2.5}, {x: 3.8, y: 4.2}, {x: 3.5, y: 4.5}, {x: 3.9, y: 4.1},
                {x: 3.7, y: 4.3}, {x: 3.6, y: 4.4}
            ]
        };

        const container = document.createElement('div');
        container.className = 'sample-data-buttons';
        container.innerHTML = `
            <h3>Hoặc sử dụng dữ liệu mẫu:</h3>
            <div class="button-group">
                <button onclick="window.chameleonUI.loadSampleData('mau_don_gian')">Dữ liệu Đơn Giản</button>
                <button onclick="window.chameleonUI.loadSampleData('khach_hang')">Dữ liệu Khách Hàng</button>
                <button onclick="window.chameleonUI.loadSampleData('phuc_tap')">Dữ liệu Phức Tạp</button>
            </div>
        `;

        document.querySelector('.file-upload').after(container);

        // Lưu dữ liệu mẫu
        this.sampleData = sampleData;
    }

    loadSampleData(dataType) {
        this.data = this.sampleData[dataType];
        this.displayDataPreview();
        document.getElementById('startClustering').disabled = false;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                const text = await file.text();
                this.data = this.parseCSV(text);
                this.displayDataPreview();
                document.getElementById('startClustering').disabled = false;
            } catch (error) {
                alert('Lỗi khi đọc file CSV: ' + error.message);
            }
        }
    }

    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
                obj[header] = parseFloat(values[index]);
                return obj;
            }, {});
        });
    }

    displayDataPreview() {
        const stats = document.getElementById('clusterStats');
        const sample = this.data.slice(0, 3);
        const features = Object.keys(this.data[0]);

        stats.innerHTML = `
            <h3>Thông Tin Dữ Liệu</h3>
            <p>Số lượng điểm dữ liệu: ${this.data.length}</p>
            <p>Các thuộc tính: ${features.join(', ')}</p>
            <h4>Xem trước dữ liệu:</h4>
            <table class="data-preview">
                <thead>
                    <tr>${features.map(f => `<th>${f}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${sample.map(point => `
                        <tr>${features.map(f => `<td>${point[f]}</td>`).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    startClustering() {
        const k = parseInt(document.getElementById('kNearest').value);
        const minClusterSize = parseInt(document.getElementById('minClusterSize').value);

        const chameleon = new ChameleonClustering(k, minClusterSize);
        const clusteredData = chameleon.cluster(this.data);

        this.visualizeClusters(clusteredData);
        this.displayClusterStats(clusteredData);
    }

    visualizeClusters(data) {
        const container = document.getElementById('clusterVisualization');
        container.innerHTML = '';

        const width = this.width - this.margin.left - this.margin.right;
        const height = this.height - this.margin.top - this.margin.bottom;

        const svg = d3.select('#clusterVisualization')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Get feature names (assuming 2D data)
        const features = Object.keys(data[0]).filter(key => key !== 'id' && key !== 'cluster');
        const xFeature = features[0];
        const yFeature = features[1];

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([
                d3.min(data, d => d[xFeature]),
                d3.max(data, d => d[xFeature])
            ])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(data, d => d[yFeature]),
                d3.max(data, d => d[yFeature])
            ])
            .range([height, 0]);

        // Add axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        svg.append('g')
            .call(yAxis);

        // Add axis labels
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + 35)
            .style('text-anchor', 'middle')
            .text(xFeature);

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -35)
            .style('text-anchor', 'middle')
            .text(yFeature);

        // Draw points
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d[xFeature]))
            .attr('cy', d => yScale(d[yFeature]))
            .attr('r', 6)
            .attr('fill', d => colorScale(d.cluster))
            .attr('opacity', 0.7)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('r', 8)
                    .attr('opacity', 1);

                svg.append('text')
                    .attr('class', 'tooltip')
                    .attr('x', xScale(d[xFeature]) + 10)
                    .attr('y', yScale(d[yFeature]) - 10)
                    .text(`(${d[xFeature]}, ${d[yFeature]})`)
                    .style('fill', 'black');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('r', 6)
                    .attr('opacity', 0.7);
                
                svg.selectAll('.tooltip').remove();
            });
    }

    displayClusterStats(data) {
        const clusters = {};
        data.forEach(point => {
            if (!clusters[point.cluster]) {
                clusters[point.cluster] = [];
            }
            clusters[point.cluster].push(point);
        });

        const stats = document.getElementById('customerGroups');
        stats.innerHTML = '<h3>Thống Kê Phân Cụm</h3>';

        Object.entries(clusters).forEach(([cluster, points]) => {
            const features = Object.keys(points[0]).filter(key => key !== 'id' && key !== 'cluster');
            const averages = features.reduce((acc, feature) => {
                acc[feature] = d3.mean(points, p => p[feature]).toFixed(2);
                return acc;
            }, {});

            stats.innerHTML += `
                <div class="cluster-stat">
                    <h4>Cụm ${parseInt(cluster) + 1}</h4>
                    <p>Số lượng điểm: ${points.length}</p>
                    <p>Giá trị trung bình:</p>
                    <ul>
                        ${Object.entries(averages).map(([feature, value]) => 
                            `<li>${feature}: ${value}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        });
    }
}

// Initialize the UI and make it globally accessible
document.addEventListener('DOMContentLoaded', () => {
    window.chameleonUI = new ChameleonUI();
}); 