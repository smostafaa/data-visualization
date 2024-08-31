const worldMap = {
    width: 500,
    height: 250,
    svg: null,
    projection: null,
    path: null,
    g: null,
    countries: ['China', 'Germany', 'United States', 'Australia', 'Brazil', 'Russia'],
    selectedCountry: null,

    init(container) {
        this.svg = d3.select(container).append("svg")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`);

        this.projection = d3.geoEquirectangular()
            .fitSize([this.width, this.height], {type: "Sphere"})
            .scale(80)
            .translate([this.width / 2, this.height / 2 + 40]);

        this.path = d3.geoPath().projection(this.projection);

        this.g = this.svg.append("g");

        this.svg.append("text")
            .attr("x", this.width / 3)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .attr("class", "country-name");

        this.loadMap();
    },

    loadMap() {
        Promise.all([
            d3.json("https://unpkg.com/world-atlas@1.1.4/world/50m.json"),
            d3.tsv("https://unpkg.com/world-atlas@1.1.4/world/50m.tsv")
        ]).then(([topology, tsvData]) => {
            const countries = topojson.feature(topology, topology.objects.countries);

            countries.features.forEach((feature) => {
                const { name } = tsvData.find(({ iso_n3: id }) => id === feature.id);
                feature.properties.name = name === 'Ashmore and Cartier Is.' ? 'Australia' : name;
            });

            this.g.selectAll("path")
                .data(countries.features)
                .enter().append("path")
                .attr("d", this.path)
                .attr("class", d => {
                    const countryName = d.properties.name;
                    return `country ${this.countries.includes(countryName) ? 'stage' : ''}`;
                })
                .attr("id", d => this.countries.includes(d.properties.name) ? d.properties.name : null)
                .on("mouseenter", (event, d) => {
                    if (this.countries.includes(d.properties.name)) {
                        this.onCountryHover(d.properties.name);
                    }
                })
                .on("click", (event, d) => {
                    if (this.countries.includes(d.properties.name)) {
                        this.onCountryClick(d.properties.name);
                    }
                });

            this.onCountryHover(this.countries[0]);
        });
    },

    onCountryHover(countryName) {
        this.g.selectAll('path.country')
            .attr('id', d => d.properties.name === countryName ? 'selection' : null);

        this.svg.select('.country-name')
            .text(countryName);

        this.selectedCountry = countryName;
    },

    onCountryClick(countryName) {
        if (this.countries.includes(countryName)) {
            this.selectedCountry = countryName;
            
            if (typeof this.onCountrySelect === 'function') {
                this.onCountrySelect(countryName);
            }
        }
    },

    reset() {
        this.selectedCountry = null;
        this.g.selectAll('path.country').attr('id', null);
        this.svg.select('.country-name').text('');
    }
};