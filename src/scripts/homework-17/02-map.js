import * as d3 from 'd3'
import * as topojson from 'topojson'

const margin = { top: 0, left: 20, right: 20, bottom: 0 }

const height = 400 - margin.top - margin.bottom

const width = 700 - margin.left - margin.right

const svg = d3
  .select('#chart-2')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3
  .geoEqualEarth()
  .translate([width / 2, height / 2])
  .scale(125)
const path = d3.geoPath().projection(projection)

Promise.all([
  d3.json(require('/data/world.topojson')),
  d3.csv(require('/data/airport-codes-subset.csv')),
  d3.csv(require('/data/flights.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

const coordinateStore = d3.map()

function ready([json, airports, flights]) {
  // console.log('What is our data?')
  // console.log(json)
  // console.log(datapoints)
  const countries = topojson.feature(json, json.objects.countries)

  airports.forEach(d => {
    const code = d.iata_code
    const coords = [d.longitude, d.latitude]
    coordinateStore.set(code, coords)
  })

  // console.log(coordinateStore)

  svg
    .append('path')
    .datum({ type: 'Sphere' })
    .attr('d', path)
    .attr('fill', 'lightblue')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)

  svg
    .selectAll('.country')
    .data(countries.features)
    .enter()
    .append('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', 'lightgrey')
    .attr('stroke', 'black')

  // add one circle for every world city
  svg
    .selectAll('circle')
    .data(airports)
    .enter()
    .append('circle')
    .attr('r', 2)
    // .attr('opacity', 1)
    .attr('fill', 'white')
    .attr('transform', function(d) {
      const coords = [d.longitude, d.latitude]
      // console.log(projection(coords))
      return `translate(${projection(coords)})`
    })

  const jfk = [-73.7781, 40.6513] // hard-coded based on Google search
  const codes = airports.map(d => d.iata_code)

  svg
    .selectAll('.transit')
    .data(flights)
    .enter()
    .append('path')
    .attr('d', d => {
      // Pull out our coordinates, if we have code for airport
      if (codes.includes(d.code) === true) {
        const toCoords = coordinateStore.get(d.code)
        // console.log(d.code)
        // console.log(toCoords)

        // Build a GeoJSON LineString
        const geoLine = {
          type: 'LineString',
          coordinates: [jfk, toCoords]
        }

        // Feed that to our d3.geoPath()
        return path(geoLine)
      }
    })
    .attr('fill', 'none')
    .attr('stroke', 'white')
}
