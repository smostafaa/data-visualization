const donutChart = {
    width: 0,
    height: 0,
    svg: null,
    pieGenerator: null,
    arcGenerator: null,
    data: null,
    colors: d3.scaleOrdinal(d3.schemeCategory10),
    energySources: ['Atom', 'Green', 'Gas', 'Kohle', 'Fossil'],
    currentYear: 2000,

    init(container) {
        this.width = container.clientWidth;
        this.height = container.clientHeight;
    
        this.svg = d3.select(container).append("svg")
            .attr("width", this.width)
            .attr("height", this.height);
    
        const margin = { top: 40, right: 20, bottom: 60, left: 20 }; // Erhöhter oberer Rand für die Überschrift
        const chartWidth = this.width - margin.left - margin.right;
        const chartHeight = this.height - margin.top - margin.bottom;
    
        const donutSize = Math.min(chartWidth / 6, chartHeight / 2.5) / 2;
        const spacing = 2;
    
        this.pieGenerator = d3.pie().sort(null).value(d => d.value);
        this.arcGenerator = d3.arc().innerRadius(donutSize * 0.6).outerRadius(donutSize);
    
        const chartArea = this.svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Hinzufügen der Überschrift
        this.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", this.width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Anteil der Energiequellen im Zeitverlauf"
);
    
        for (let i = 0; i < 5; i++) {
            const group = chartArea.append("g")
                .attr("class", `donut-${i}`)
                .attr("transform", `translate(${(i + 0.5) * (chartWidth / 5 + spacing)}, ${chartHeight / 2})`);
            
            group.append("text")
                .attr("class", "donut-label")
                .attr("text-anchor", "middle")
                .attr("dy", -donutSize - 10)
                .text(this.energySources[i]);
        }
    
        this.addRangeSlider(container);
    },

    addRangeSlider(container) {
        const sliderContainer = d3.select(container).append("div")
            .attr("class", "slider-container");

        sliderContainer.append("label")
            .attr("id", "range-value")
            .attr("for", "range")
            .text(this.currentYear);

        sliderContainer.append("input")
            .attr("id", "range")
            .attr("type", "range")
            .attr("name", "range")
            .attr("min", 2000)
            .attr("max", 2020)
            .attr("value", this.currentYear)
            .on("input", (event) => {
                this.currentYear = +event.target.value;
                d3.select("#range-value").text(this.currentYear);
                this.updateYear();
            });
    },

    update(countryData) {
        this.data = countryData;
        this.updateYear();
    },

    updateYear() {
        if (!this.data) return;
    
        const yearData = this.data[this.currentYear];
    
        this.energySources.forEach((source, i) => {
            const donutData = [
                { name: source, value: yearData[source] },
                { name: 'Rest', value: d3.sum(Object.values(yearData)) - yearData[source] }
            ];
    
            const group = this.svg.select(`.donut-${i}`);
            const arcs = group.selectAll(".arc")
                .data(this.pieGenerator(donutData));
    
            // Remove exiting arcs
            arcs.exit().remove();
    
            // Enter new arcs and merge with existing
            arcs.enter()
                .append("path")
                .attr("class", "arc")
                .attr("fill", (d, i) => i === 0 ? this.colors(source) : "#ccc")
                .each(function(d) { this._current = { startAngle: 0, endAngle: 0 }; }) // Store the initial angles
                .merge(arcs)
                .transition()
                .duration(1000)
                .attrTween("d", function(d) {
                    const interpolate = d3.interpolate(this._current, d);
                    this._current = interpolate(1);
                    return function(t) {
                        return donutChart.arcGenerator(interpolate(t));
                    };
                });
    
            // Update percentage text
            group.selectAll(".percentage-text").remove();
            group.append("text")
                .attr("class", "percentage-text")
                .attr("text-anchor", "middle")
                .attr("dy", ".35em")
                .text(`${((yearData[source] / d3.sum(Object.values(yearData))) * 100).toFixed(1)}%`)
                .style("opacity", 0)  // Start with 0 opacity
                .transition()
                .duration(1000)
                .style("opacity", 1);  // Fade in the text
        });
    },

    reset() {
        this.currentYear = 2000;
        d3.select("#range").property("value", this.currentYear);
        d3.select("#range-value").text(this.currentYear);
        this.svg.selectAll(".arc").remove();
        this.svg.selectAll(".percentage-text").remove();
    }
};
