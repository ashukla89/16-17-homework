import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 150, right: 0, bottom: 0 }

const height = 600 - margin.top - margin.bottom

const width = 900 - margin.left - margin.right

const svg = d3
  .select('#chart-5')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3
  .geoAlbersUsa()
  .scale(1000)
  .translate([width / 2, height / 2])
const path = d3.geoPath().projection(projection)

const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
const radiusScale = d3.scaleSqrt().range([0, 6])
const pointScale = d3.scalePoint().range([120, height - 120])

Promise.all([
  d3.json(require('/data/us_states.topojson')),
  d3.csv(require('/data/powerplants.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  console.log('What is our data?')
  console.log(json)
  console.log(datapoints)

  const states = topojson.feature(json, json.objects.us_states)

  projection.fitSize([width, height], states)

  svg
    .selectAll('path')
    .data(states.features)
    .enter()
    .append('path')
    .attr('class', function(d) {
      return 'state ' + d.properties.abbrev
    })
    .attr('d', path)
    .attr('fill', 'lightgrey')

  const mwExt = d3.extent(datapoints, d => d.Total_MW)
  radiusScale.domain(mwExt)

  // add one circle for every powerplant
  svg
    .selectAll('.plant-circle')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('r', d => radiusScale(d.Total_MW))
    .attr('opacity', 0.5)
    .attr('fill', d => colorScale(d.PrimSource))
    .attr('transform', function(d) {
      const coords = [d.Longitude, d.Latitude]
      // console.log(projection(coords))
      return `translate(${projection(coords)})`
    })

  // add state labels
  svg
    .selectAll('.state-text')
    .data(states.features)
    .enter()
    .append('text')
    .text(function(d) {
      return d.properties.abbrev
    })
    .attr('transform', function(d) {
      return `translate(${path.centroid(d)})`
    })
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .style(
      'text-shadow',
      '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
    )

  const sources = colorScale.domain()

  pointScale.domain(sources)

  svg
    .selectAll('g')
    .data(sources)
    .enter()
    .append('g')
    .attr('transform', function(d) {
      return `translate(${40 - margin.left},${pointScale(d)})`
    })
    .each(function(d) {
      const svg = d3.select(this)

      svg
        .append('circle')
        .attr('class', function(d) {
          return 'label-circle ' + d
        })
        .attr('r', 10)
        .attr('fill', d => colorScale(d))

      svg
        .append('text')
        .text(d => d.charAt(0).toUpperCase() + d.slice(1))
        .attr('dx', 12)
        .attr('font-size', 12)
        .attr('text-anchor', 'left')
        .style('alignment-baseline', 'middle')
    })
}
