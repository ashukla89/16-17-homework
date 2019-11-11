import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 0, right: 0, bottom: 0 }

const height = 500 - margin.top - margin.bottom

const width = 900 - margin.left - margin.right

const svg = d3
  .select('#chart-4a')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3.geoAlbers().scale(1000)
const path = d3.geoPath().projection(projection)

const colorScale = d3.scaleSequential(d3.interpolatePiYG)
const opacityScale = d3.scaleLinear().range([0, 1])

// const pops = []

d3.json(require('/data/counties_with_election_data.topojson'))
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready(json) {
  console.log('What is our data?')
  console.log(json)

  const counties = topojson.feature(json, json.objects.us_counties)

  colorScale.domain([1, -1])

  // calculate range of county populations for opacityScale domain
  // counties.features.forEach(d => {
  //   const totPop = d.properties.clinton + d.properties.trump
  //   pops.push(totPop)
  // })
  // const popExt = d3.extent(pops)
  opacityScale.domain([0, 100000]) // nevermind, just set domain arbitrarily, it works better that way

  svg
    .selectAll('path')
    .data(counties.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', function(d) {
      return colorScale(
        (d.properties.clinton - d.properties.trump) /
          (d.properties.clinton + d.properties.trump)
      )
    })
    .attr('opacity', function(d) {
      return opacityScale(d.properties.clinton + d.properties.trump)
    })
}
