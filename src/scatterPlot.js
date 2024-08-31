// scatterPlot.js
const scatterPlot = {
    width: 0,
    height: 0,
    svg: null,
    x: null,
    y: null,
    line: null,
    colors: d3.scaleOrdinal(d3.schemeCategory10),
    energySources: ['Atom', 'Green', 'Gas', 'Kohle', 'Fossil'],
    data: null,

    init(container) {
        this.width = container.clientWidth - 60;
        this.height = container.clientHeight - 60;

        this.svg = d3.select(container).append("svg")
            .attr("width", this.width + 60)
            .attr("height", this.height + 60)
            .append("g")
            .attr("transform", "translate(40,20)");

        this.x = d3.scaleLinear()
            .range([0, this.width]);

        this.y = d3.scaleLinear()
            .range([this.height, 0]);

        this.line = d3.line()
            .x(d => this.x(d.year))
            .y(d => this.y(d.value));

        this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.height})`);

        this.svg.append("g")
            .attr("class", "y-axis");

        // Titel hinzufügen
        this.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", this.width / 2)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .text("Energiequellen Entwicklung 2000-2020");

        // X-Achsen-Beschriftung
        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("x", this.width / 2)
            .attr("y", this.height + 40)
            .attr("text-anchor", "middle")
            .text("Jahr");

        // Y-Achsen-Beschriftung
        this.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.height / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .text("TWh");

        // Legende
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width - 100}, 0)`);

        this.energySources.forEach((source, i) => {
            const legendRow = legend.append("g")
                .attr("class", "legend-item")
                .attr("transform", `translate(0, ${i * 20})`)
                .style("cursor", "pointer")
                .on("click", () => this.toggleSource(source));

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", this.colors(source));

            legendRow.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .style("text-transform", "capitalize")
                .text(source);
        });
    },

    update(countryData) {
        this.data = countryData;
        if (!this.data) {
            this.reset();
            return;
        }

        const years = Object.keys(this.data).map(Number);
        const allValues = this.energySources.flatMap(source => 
            years.map(year => this.data[year][source])
        );

        this.x.domain(d3.extent(years));
        this.y.domain([0, d3.max(allValues)]);

        this.svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(this.x).tickFormat(d3.format("d")));

        this.svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(this.y));

        this.energySources.forEach(source => {
            const sourceData = years.map(year => ({
                year: year,
                value: this.data[year][source]
            }));

            const path = this.svg.selectAll(`.line-${source}`)
                .data([sourceData]);

            path.enter()
                .append("path")
                .attr("class", `line line-${source}`)
                .merge(path)
                .transition()
                .duration(1000)
                .attr("d", this.line)
                .attr("fill", "none")
                .attr("stroke", this.colors(source))
                .attr("stroke-width", 2);

            const dots = this.svg.selectAll(`.dot-${source}`)
                .data(sourceData);

            dots.enter()
                .append("circle")
                .attr("class", `dot dot-${source}`)
                .merge(dots)
                .transition()
                .duration(1000)
                .attr("cx", d => this.x(d.year))
                .attr("cy", d => this.y(d.value))
                .attr("r", 4)
                .attr("fill", this.colors(source));

            dots.exit().remove();
        });
    },

    toggleSource(source) {
        const visibility = this.svg.selectAll(`.line-${source}`).style("opacity");
        this.svg.selectAll(`.line-${source}, .dot-${source}`)
            .transition()
            .style("opacity", visibility == 1 ? 0 : 1);
    },

    reset() {
        this.svg.selectAll(".line, .dot").remove();
        this.svg.select(".x-axis").call(d3.axisBottom(this.x.domain([2000, 2020])));
        this.svg.select(".y-axis").call(d3.axisLeft(this.y.domain([0, 100])));
    }
};