import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 0, right: 0, bottom: 0 }

const height = 500 - margin.top - margin.bottom

const width = 900 - margin.left - margin.right

const svg = d3
  .select('#chart-1')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .style('background-color', 'black')
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3.geoMercator()
const graticule = d3.geoGraticule()
const path = d3.geoPath().projection(projection)

const colorScale = d3.scaleSequential(d3.interpolateCool).clamp(true)

Promise.all([
  d3.json(require('/data/world.topojson')),
  d3.csv(require('/data/world-cities.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  // console.log('What is our data?')
  // console.log(json)
  // console.log(datapoints)
  const countries = topojson.feature(json, json.objects.countries)

  // const popExtent = d3.extent(datapoints, d => +d.population)
  colorScale.domain([1, 500000]) // arbitrary because too many were dark

  svg
    .selectAll('path')
    .data(countries.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', 'black')

  svg
    .append('path')
    .datum(graticule())
    .attr('d', path)
    .attr('stroke', 'grey')
    .attr('stroke-width', 0.5)
    .attr('fill', 'none')
    .lower()

  // add one circle for every world city
  svg
    .selectAll('circle')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('r', 0.5)
    // .attr('opacity', 1)
    .attr('fill', d => colorScale(+d.population))
    .attr('transform', function(d) {
      const coords = [d.lng, d.lat]
      // console.log(projection(coords))
      return `translate(${projection(coords)})`
    })
}
