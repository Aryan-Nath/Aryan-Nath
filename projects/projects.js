import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

let query = '';
let selectedIndex = -1;

function renderPieChart(projectsGiven) {
  // 1. Group by year
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // 2. Setup D3 Generators
  let colors = d3.scaleOrdinal(d3.schemeTableau10);
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // 3. Clear existing content
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // 4. Render Paths
  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        // Apply visual selection to paths
        svg.selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Apply visual selection to legend
        legend.selectAll('li')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Filter projects by BOTH query and selected year
        applyFilters();
      });
  });

  // 5. Render Legend
  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

function applyFilters() {
  // Filter by query first
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Then filter by selected year if applicable
  if (selectedIndex !== -1) {
    // We need to get the year from the pie chart's data
    // Recalculate the rolled data for the current query to find the year label
    let rolledData = d3.rollups(
        projects.filter(p => Object.values(p).join('\n').toLowerCase().includes(query.toLowerCase())),
        (v) => v.length,
        (d) => d.year,
      );
    let currentData = rolledData.map(([year, count]) => ({ value: count, label: year }));
    
    if (currentData[selectedIndex]) {
        let selectedYear = currentData[selectedIndex].label;
        filteredProjects = filteredProjects.filter(p => p.year === selectedYear);
    }
  }

  // Render the results
  renderProjects(filteredProjects, projectsContainer, 'h2');
  projectsTitle.textContent = `${filteredProjects.length} Projects`;
}

// Initial render
applyFilters();
renderPieChart(projects);

// Search event listener
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  
  // Reset selection when searching
  selectedIndex = -1;

  // Re-calculate filtered projects for the pie chart
  let filteredProjectsByQuery = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Update projects and pie chart
  applyFilters();
  renderPieChart(filteredProjectsByQuery);
});
