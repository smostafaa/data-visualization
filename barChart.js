const barChart = {
    width: 0,
    height: 0,
    svg: null,
    x: null,
    y: null,
    data: null,
    energySources: ['Atom', 'Green', 'Gas', 'Kohle', 'Fossil'],
    colors: null,
    tooltip: null,
    maxDisplayedChange: 500, // Feste Skala bei ±500%

    init(container) {
        this.width = container.clientWidth - 60;
        this.height = container.clientHeight - 60;

        this.svg = d3.select(container).append("svg")
            .attr("width", this.width + 60)
            .attr("height", this.height + 60)
            .append("g")
            .attr("transform", "translate(80,30)");

        this.x = d3.scaleLinear()
            .range([0, this.width])
            .domain([-this.maxDisplayedChange, this.maxDisplayedChange]);

        this.y = d3.scaleBand()
            .range([0, this.height])
            .padding(0.1);

        this.colors = d3.scaleOrdinal()
            .domain(this.energySources)
            .range(d3.schemeCategory10);
        
        // Ändern Sie die Farbe für "Erneubare" auf Grün
        this.colors.range(this.colors.range().map((color, i) => 
            this.energySources[i] === 'Erneubare' ? 'green' : color
        ));

        this.svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.height})`);

        this.svg.append("g")
            .attr("class", "y-axis");

        this.svg.append("line")
            .attr("class", "zero-line")
            .attr("y1", 0)
            .attr("y2", this.height)
            .style("stroke", "#ffffff")
            .style("stroke-dasharray", "4");

        this.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", this.width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .text("Energiequellen Wachstum 2000-2020");

        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    },

    update(countryData) {
        if (!countryData) {
            this.reset();
            return;
        }
      
        this.data = this.energySources.map(source => {
            const value2000 = countryData[2000][source] || 0;
            const value2020 = countryData[2020][source] || 0;
            let percentChange = 0;
            if (value2000 !== 0) {
                percentChange = ((value2020 - value2000) / value2000) * 100;
            } else if (value2020 !== 0) {
                percentChange = 100;
            }
            return {
                source: source,
                percentChange: percentChange
            };
        }).sort((a, b) => this.energySources.indexOf(a.source) - this.energySources.indexOf(b.source));
    
        this.y.domain(this.energySources);
    
        this.svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(this.x).tickFormat(d => d + "%"));
    
        this.svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(this.y));
    
        this.svg.select(".zero-line")
            .attr("x1", this.x(0))
            .attr("x2", this.x(0));
    
        const bars = this.svg.selectAll(".bar")
            .data(this.data);
    
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .transition()
            .duration(1000)
            .attr("y", d => this.y(d.source))
            .attr("height", this.y.bandwidth())
            .attr("x", d => d.percentChange < 0 ? this.x(Math.max(d.percentChange, -this.maxDisplayedChange)) : this.x(0))
            .attr("width", d => {
                const absChange = Math.abs(d.percentChange);
                const displayedChange = Math.min(absChange, this.maxDisplayedChange);
                return Math.abs(this.x(displayedChange) - this.x(0));
            })
            .attr("fill", d => this.colors(d.source))
            .style("opacity", d => d.percentChange === 0 ? 0.3 : 1);
    
        bars.exit().remove();
    
        const labels = this.svg.selectAll(".bar-label")
            .data(this.data);
    
        labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .merge(labels)
            .transition()
            .duration(1000)
            .attr("y", d => this.y(d.source) + this.y.bandwidth() / 2)
            .attr("x", d => {
                const absChange = Math.abs(d.percentChange);
                const displayedChange = Math.min(absChange, this.maxDisplayedChange);
                const barWidth = Math.abs(this.x(displayedChange) - this.x(0));
                return d.percentChange < 0 ? this.x(Math.max(d.percentChange, -this.maxDisplayedChange)) + barWidth / 2 : this.x(0) + barWidth / 2;
            })
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .text(d => {
                const formattedChange = d3.format("+.1f")(d.percentChange);
                return Math.abs(d.percentChange) > this.maxDisplayedChange ? `${formattedChange}% →` : `${formattedChange}%`;
            })
            .style("fill", d => this.getContrastColor(this.colors(d.source)))
            .style("font-weight", "bold");
    
        labels.exit().remove();

        this.svg.selectAll(".bar")
            .on("mouseover", (event, d) => {
                this.tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                this.tooltip.html(`${d.source}<br/>Änderung: ${d3.format("+.1f")(d.percentChange)}%`)
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", (d) => {
                this.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        const noDataText = this.svg.selectAll(".no-data-text")
            .data(this.data.filter(d => d.percentChange === 0));

        noDataText.enter()
            .append("text")
            .attr("class", "no-data-text")
            .merge(noDataText)
            .attr("x", this.x(0))
            .attr("y", d => this.y(d.source) + this.y.bandwidth() / 2)
            .attr("dx", 5)
            .attr("alignment-baseline", "middle")
            .text("Keine Daten verfügbar");

        noDataText.exit().remove();
    },

    reset() {
        this.svg.selectAll(".bar").remove();
        this.svg.selectAll(".bar-label").remove();
        this.svg.selectAll(".no-data-text").remove();
        this.svg.select(".x-axis").call(d3.axisBottom(this.x));
        this.svg.select(".y-axis").call(d3.axisLeft(this.y.domain(this.energySources)));
        this.svg.select(".zero-line").attr("x1", this.x(0)).attr("x2", this.x(0));
    },

    getContrastColor(hexcolor) {
        const r = parseInt(hexcolor.substr(1,2),16);
        const g = parseInt(hexcolor.substr(3,2),16);
        const b = parseInt(hexcolor.substr(5,2),16);
        
        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        
        return (yiq >= 128) ? 'black' : 'white';
    }
};
