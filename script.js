let data;
const energySources = ['Atom', 'Green', 'Gas', 'Kohle', 'Fossil'];
const countries = ['China', 'Germany', 'United States', 'Australia', 'Brazil', 'Russia'];
const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(energySources);

function loadData() {
    d3.csv("data/data.csv").then(csvData => {
        data = processData(csvData);
        setupShowContentButton();
    }).catch(error => console.error("Error loading data:", error));
}

function processData(csvData) {
    const processedData = {};
    csvData.forEach(d => {
      if (!processedData[d.Land]) {
        processedData[d.Land] = {};
      }
      if (!processedData[d.Land][d.Jahr]) {
        processedData[d.Land][d.Jahr] = {};
      }
      energySources.forEach(source => {
        processedData[d.Land][d.Jahr][source] = +d[source] || 0; // Ersetze fehlende Werte mit 0
      });
    });
    return processedData;
  }

function setupShowContentButton() {
    const showContentButton = document.getElementById('showContentButton');
    const contentContainer = document.getElementById('contentContainer');

    showContentButton.addEventListener('click', function() {
        showContentButton.style.display = 'none';
        contentContainer.style.display = 'block';

        // Animate the content container
        gsap.fromTo(contentContainer, {
            opacity: 0,
            y: 50
        }, {
            duration: 1,
            opacity: 1,
            y: 0,
            ease: "power3.out",
            onComplete: initCharts
        });
    });
}

function initCharts() {
    const containers = {
        worldMap: document.getElementById('worldMap'),
        barChart: document.getElementById('barChart'),
        donutChart: document.getElementById('donutChart'),
        scatterPlot: document.getElementById('scatterPlot')
    };

    worldMap.init(containers.worldMap);
    barChart.init(containers.barChart);
    donutChart.init(containers.donutChart);
    scatterPlot.init(containers.scatterPlot);

    worldMap.onCountrySelect = updateCharts;
}

function updateCharts(country) {
    console.log("Updating charts for country:", country);
    if (data && data[country]) {
        const countryData = data[country];
        console.log("Country data:", countryData);
        barChart.update(countryData);
        donutChart.update(countryData);
        scatterPlot.update(countryData);
    } else {
        console.error("No data available for", country);
    }
}

function resetCharts() {
    worldMap.reset();
    barChart.reset();
    donutChart.reset();
    scatterPlot.reset();
}

document.addEventListener('DOMContentLoaded', loadData);
