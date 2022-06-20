import * as d3 from 'd3'
import { parse } from 'handlebars'
// import { getConsoleOutput } from 'jest-util'
import * as topojson from 'topojson-client'

const margin = { top: 50, left: 50, right: 50, bottom: 50 }

const height = 600 - margin.top - margin.bottom

const width = 900 - margin.left - margin.right

const svg = d3
  .select('#pa-d-prim-ab-22')
  .append('svg')
  .attr('class', 'elec-chart__body')
  // .attr('height', height + margin.top + margin.bottom)
  // .attr('width', width + margin.left + margin.right)
  .attr('viewBox', `0 0 ${width+margin.left+margin.right} ${height+margin.top+margin.bottom}`)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

// projection stolen from: https://github.com/veltman/d3-stateplane
const projection = d3.geoConicConformal()
  .parallels([40 + 53 / 60, 41 + 57 / 60])
  .rotate([77 + 45 / 60, 0]);
// const projection = d3
//   .geoAlbersUsa()
//   .scale(1000)
//   .translate([width / 2, height / 2])
const path = d3.geoPath().projection(projection)

const radiusScale = d3.scaleLinear().domain([0,50000]).range([10, 140])
const strokeScale = d3.scaleLinear().domain([0,50000]).range([1.5,4])

Promise.all([
  d3.json(require('/data/pa22_primary_votediffs.topojson')),
  //d3.csv(require('/data/suprm21_suprm17.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json]) {
  console.log('What is our data?')
  console.log(json)
  // console.log(datapoints)

  const datapoints = topojson.feature(json, json.objects.pa22_primary_votediffs)
  console.log("datapoints", datapoints)

  projection.fitSize([width, height], datapoints)

  svg
    .selectAll('path')
    .data(datapoints.features)
    .enter()
    .append('path')
    .attr('class', function(d) {
      console.log(d.properties.NAME)
      return `county county--${d.properties.NAME.toLowerCase().replace(" ","-")}`
    })
    .attr('d', path)
    .attr('fill', 'white')
    .attr('stroke','darkgrey')
    //.attr('data-DEM_Votes', d => d.properties.DEM_Votes) // dummy data
    // add attributes here
    // for margin shifts: text labels countyname, margin swing
    // for turnout: text labels below centroid just absolute vote change and county
    // add gs for each county: text label, arrow, and outline of each county
    // consider mobile-- needs to be tappable
    // needs labels and legend, although perhaps outside the svg itself

  // add blue arrows for positive values
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'blue-arrow')
    .attr('viewBox', [0, 0, 4, 4])
    .attr('refX', 2)
    .attr('refY', 2)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', d3.line()([[0, 0], [0, 4], [4, 2]]))
    .attr('fill', '#1A6AFF')
    .attr('opacity', 1)

  // add gray arrows for negative values
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'gray-arrow')
    .attr('viewBox', [0, 0, 4, 4])
    .attr('refX', 2)
    .attr('refY', 2)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', d3.line()([[0, 0], [0, 4], [4, 2]]))
    .attr('fill', '#36454F')
    .attr('opacity', 1)
    // inspect McKean county!!

  // add a line for every county
  svg
    .selectAll('.lines')
    .data(datapoints.features)
    .enter()
    .append('line')
    .attr('x1', d => path.centroid(d)[0])
    .attr('y1', d => path.centroid(d)[1])
    .attr('x2', d => path.centroid(d)[0])
    .attr('y2', function(d) {
      console.log(radiusScale(d.properties.DEMVoteDelta))
      return path.centroid(d)[1] - radiusScale(Math.abs(d.properties.DEMVoteDelta))
    })
    .attr('class', 'lines')
    .attr('opacity', 1)
    .attr('stroke', d => {
        if (d.properties.DEMVoteDelta > 0) return '#1A6AFF'
        else return '#36454F'
      })
    .attr("stroke-width", d => strokeScale(Math.abs(d.properties.DEMVoteDelta)))
    // below will be redundant because those will be passed to line
    .attr('marker-end', d => {
      if (d.properties.DEMVoteDelta > 0) return 'url(#blue-arrow)'
      else return 'url(#gray-arrow)'
    })
    .attr('transform', function(d) {
      const rotate = d.properties.DEMVoteDelta > 0 ? '0' : '180'
      return `rotate(${rotate} ${path.centroid(d)[0]} ${path.centroid(d)[1]})`
    })

  // for tooltip:
  // create svg but load attributes with data for each county on basemap
  
  // for toggling
  // preload basemap as one svg
  // have each set of arrows be another set of svgs
  // toggle between visibility using buttons

  // will get on page via github gist
  // keep secret/ public or whatever
  // will paste contents of svg into gist
  // archiedoc documentation shows how to do this
  // (add it inline the way you would a datawrapper link)

  // labels grouping
  const labels = svg
    .selectAll('.labels')
    .data(datapoints.features)
    .enter()
    .append('g')
    .attr('class', d => `labels labels--${d.properties.NAME.toLowerCase().replace(" ","-")}`)
    .attr('opacity', 0)

  // county name
  labels
    .append('text')
    .text(function(d) {
      return d.properties.NAME
    })
    .attr('transform', function(d) {
      return `translate(${path.centroid(d)})`
    })
    .attr('dy', 15)
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('font-family', '"Ringside Regular SSm","Verdana",sans-serif')
    .style(
      'text-shadow',
      '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
    )
    .style('font-weight','bold')

  // data to be shown
  labels
    .append('text')
    .text(function(d) {
      const gain = d.properties.DEMVoteDelta > 0 ? '+' : ''
      return `${gain}${d3.format(",")(parseFloat((d.properties.DEMVoteDelta)).toFixed(1))} votes`
    })
    .attr('transform', function(d) {
      return `translate(${path.centroid(d)})`
    })
    .attr('dy', 35)
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('font-family', '"Ringside Regular SSm","Verdana",sans-serif')
    .style(
      'text-shadow',
      '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
    )
}
