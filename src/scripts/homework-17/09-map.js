import * as d3 from 'd3'
import { parse } from 'handlebars'
// import { getConsoleOutput } from 'jest-util'
import * as topojson from 'topojson'

const margin = { top: 50, left: 0, right: 0, bottom: 50 }

const height = 600 - margin.top - margin.bottom

const width = 600 - margin.left - margin.right

const svg = d3
  .select('#chart-9')
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

const radiusScale = d3.scaleLinear().domain([0,1]).range([10, 400])
const strokeScale = d3.scaleLinear().domain([0,1]).range([1.5,14])

Promise.all([
  d3.json(require('/data/nj_counties_govcomp.topojson')),
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready([json]) {
  console.log('What is our data?')
  console.log(json)
  // console.log(datapoints)

  const datapoints = topojson.feature(json, json.objects.data)
  console.log("datapoints", datapoints)

  projection.fitSize([width, height], datapoints)

  svg
    .selectAll('path')
    .data(datapoints.features)
    .enter()
    .append('path')
    .attr('class', function(d) {
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

  // add blue arrows for blue counties
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

  // add red arrows for red counties
  svg
    .append('defs')
    .append('marker')
    .attr('id', 'red-arrow')
    .attr('viewBox', [0, 0, 4, 4])
    .attr('refX', 2)
    .attr('refY', 2)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', d3.line()([[0, 0], [0, 4], [4, 2]]))
    .attr('fill', '#D03240')
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
      console.log(radiusScale(Math.abs(d.properties.DemShareDiff)))
      return path.centroid(d)[1] - radiusScale(Math.abs(d.properties.DemShareDiff))
    })
    .attr('class', 'lines')
    .attr('opacity', 1)
    .attr('stroke', d => {
        if (d.properties.DemShareDiff > 0) return '#1A6AFF'
        else return '#D03240'
      })
      .attr("stroke-width", d => strokeScale(Math.abs(d.properties.DemShareDiff)))
    // below will be redundant because those will be passed to line
    .attr('marker-end', d => {
      if (d.properties.DemShareDiff > 0) return 'url(#blue-arrow)'
      else return 'url(#red-arrow)'
    })
    .attr('transform', function(d) {
      const rotate = d.properties.DemShareDiff > 0 ? '-60' : '60'
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
      '-4px -4px 0 #fff, 4px -4px 0 #fff, -4px 4px 0 #fff, 4px 4px 0 #fff'
    )
    .style('font-weight','bold')

  // data to be shown
  labels
    .append('text')
    .text(function(d) {
      return `${parseFloat((Math.abs(d.properties.DemShareDiff)*100).toFixed(2))}-point shift`
    })
    .attr('transform', function(d) {
      return `translate(${path.centroid(d)})`
    })
    .attr('class', function(d) {
      if (d.properties.DemShareDiff > 0) return 'dem'
      else return 'rep'
    })
    .attr('dy', 35)
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .attr('font-family', '"Ringside Regular SSm","Verdana",sans-serif')
    .style(
      'text-shadow',
      '-4px -4px 0 #fff, 4px -4px 0 #fff, -4px 4px 0 #fff, 4px 4px 0 #fff'
    )

  // // generate some .css dynamically
  // const countyList = datapoints.features.map(d => d.properties.NAME.toLowerCase().replace(" ","-"))

  // let css = '';

  // countyList.forEach(county => {
  //   css += `.county--${county}:hover ~ .labels--${county} { opacity: 1; }`
  // });

  // console.log(css)
}
