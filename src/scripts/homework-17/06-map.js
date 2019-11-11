import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 0, right: 0, bottom: 0 }

const height = 300 - margin.top - margin.bottom
const width = 330 - margin.left - margin.right

const container = d3.select('#chart-6')

const projection = d3
  .geoAlbersUsa()
  .scale(1000)
  .translate([width / 2, height / 2])
const path = d3.geoPath().projection(projection)

const colorScale = d3
  .scaleOrdinal(d3.schemeCategory10)
  .domain([
    'hydroelectric',
    'coal',
    'natural gas',
    'nuclear',
    'petroleum',
    'pumped storage',
    'geothermal',
    'biomass',
    'wind',
    'other',
    'solar'
  ])
const radiusScale = d3.scaleSqrt().range([0, 6])

Promise.all([
  d3.json(require('/data/us_states.topojson')),
  d3.csv(require('/data/powerplants.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json, datapoints]) {
  //   console.log('What is our data?')
  //   console.log(json)
  //   console.log(datapoints)

  // Group your data together
  const nested = d3
    .nest()
    .key(d => d.PrimSource)
    .entries(datapoints)

  console.log(nested)

  const states = topojson.feature(json, json.objects.us_states)

  projection.fitSize([width, height], states)

  const mwExt = d3.extent(datapoints, d => d.Total_MW)
  radiusScale.domain(mwExt)

  container
    .selectAll('svg')
    .data(nested)
    .enter()
    .append('svg')
    .attr('height', height + margin.top + margin.bottom)
    .attr('width', width + margin.left + margin.right)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .each(function(d) {
      const svg = d3.select(this)

      // draw maps
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

      const source = d.key

      // add one circle for every powerplant
      svg
        .selectAll('.plant-circle')
        .data(d.values)
        .enter()
        .append('circle')
        .attr('r', d => radiusScale(d.Total_MW))
        .attr('opacity', 0.5)
        .attr('fill', colorScale(source))
        .attr('transform', function(d) {
          const coords = [d.Longitude, d.Latitude]
          // console.log(projection(coords))
          return `translate(${projection(coords)})`
        })
        .raise()

      // add source labels
      svg
        .append('text')
        .text(d.key.charAt(0).toUpperCase() + d.key.slice(1))
        .attr('class', function(d) {
          return 'label ' + d.key
        })
        .attr('transform', `translate(${width / 2},${height / 2})`)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .style(
          'text-shadow',
          '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
        )
        .raise()
    })
}
