var FlurryGraph = function(metricKey) {
  var ACTIVE_USERS_FILE_PATH  = '/json/ActiveUsers.json',
      TOTAL_USERS_FILE_PATH   = '/json/TotalUsers.json',
      metrics                 = {
                                  'all-data': {
                                    'container': '#all-data-chart',
                                    'title': 'All Data',
                                    'grapher': renderAllGraphs,
                                    'dimensions': { 'width': 960, 'height': 320 },
                                    'padding': { 'top': 20, 'right': 70, 'bottom': 50, 'left': 60 }
                                  },
                                  'active-user-ratio': {
                                    'container': '#active-user-ratio-chart',
                                    'title': 'Active User Ratio',
                                    'grapher': renderActiveUserRatioGraph,
                                    'dimensions': { 'width': 960, 'height': 540 },
                                    'padding': { 'top': 20, 'right': 50, 'bottom': 50, 'left': 60 }
                                  },
                                  'active-total-users': {
                                    'container': '#active-total-users-chart',
                                    'title': 'Total & Active Users',
                                    'grapher': renderActiveTotalUsersGraph,
                                    'dimensions': { 'width': 960, 'height': 540 },
                                    'padding': { 'top': 20, 'right': 50, 'bottom': 50, 'left': 60 }
                                  }
                                };

  // when instantiated, read data
  readData();

  /* Read data */
  function readData() {
    // read ActiveUsers.json
    d3.json(ACTIVE_USERS_FILE_PATH, function(error, activeUsersData) {
      // read TotalUsers.json
      d3.json(TOTAL_USERS_FILE_PATH, function(error, totalUsersData) {
        // analyze and prepare data for visualization
        prepareData(activeUsersData, totalUsersData);
      });
    });
  }

  /* Prepare data */
  function prepareData(activeUsersData, totalUsersData) {
    var metricTitle       = metrics[metricKey]['title'],
        activeUsersByDay  = activeUsersData['day'],     // get data array for active users
        totalUsersByDay   = totalUsersData['day'],      // get data array for total users
        numDataPoints     = activeUsersByDay.length,    // cache number of data points
        activeUserRatioData = [],                       // create new data array for vis later
        tempActiveUserRatioData = {},                   // objects to store inside data array
        tempActiveUserData,         // temp var to store active user data of current iteration
        tempTotalUserData,          // temp var to store total user data of current iteration
        currActiveUserData,         // cache current iteration's active user data
        currTotalUserData,          // cache current iteration's total user data
        currNumActiveUsers,         // cache current iteration's active users
        currNumTotalUsers,          // cache current iterations total users
        currDate;                   // current iteration's date

    // for each data point, set properties
    for (var i = 0; i < numDataPoints; i++) {
      // grab corresponding data objects for active and total users, and parse date
      currActiveUserData  = activeUsersByDay[i];
      currTotalUserData   = totalUsersByDay[i];
      currDate            = parseDate( currActiveUserData['@date'] );

      // retrieve counts for active and total users
      currNumActiveUsers      = currActiveUserData['@value'],
      currNumTotalUsers       = currTotalUserData['@value'],

      // create temporary data
      tempActiveUserData = {
        'name': 'active',
        'label': 'Active Users',
        'initYpct': 0,
        'finalYpct': currNumActiveUsers/currNumTotalUsers,
        'initYcount': 0,
        'finalYcount': currNumActiveUsers,
        'activeCount': currNumActiveUsers,
        'totalCount': currNumTotalUsers,
        'date': currDate
      };

      tempTotalUserData = {
        'name': 'total',
        'label': 'Total Users',
        'initYpct': currNumActiveUsers/currNumTotalUsers,
        'finalYpct': 1,
        'initYcount': currNumActiveUsers,
        'finalYcount': currNumTotalUsers,
        'activeCount': currNumActiveUsers,
        'totalCount': currNumTotalUsers,
        'date': currDate
      };

      // create data array object
      tempActiveUserRatioData = {
        'date': currDate,
        'generated': totalUsersData['@generatedDate'],
        'values': [ tempActiveUserData, tempTotalUserData ]
      };

      // push to new data array
      activeUserRatioData.push(tempActiveUserRatioData);
    }

    // update graph heading

    // render different graphs
    if (activeUserRatioData.length > 0) {
      metrics[metricKey]['grapher'](activeUserRatioData);
    } else {
      renderNoData();
    }

  }

  /* Renders all graphs */
  function renderAllGraphs(activeUserRatioData) {
    for (var metricKey in metrics) {
      if (metricKey !== 'all-data') {
        metrics[metricKey]['grapher'](activeUserRatioData);
      }
    }
  }

  /* Renders blank template for no data */
  function renderNoData() {
    var html = '<div class="no-data"><p>No Data Available</p></div>',
        container = metrics[metricKey]['container'];
    $(container).html(html);
  }

  /* Renders line graph */
  function renderActiveTotalUsersGraph(activeUserRatioData) {
    // declare graph width and height
    var svgDimensions   = metrics[metricKey]['dimensions'],
        svgWidth        = svgDimensions['width'],
        svgHeight       = svgDimensions['height'],
        chartPadding    = metrics[metricKey]['padding'],
        chartWidth      = svgWidth - chartPadding['left'] - chartPadding['right'],
        chartHeight     = svgHeight - chartPadding['top'] - chartPadding['bottom'],
        container       = metrics[metricKey]['container'],
        chartHeader     = metrics['active-total-users']['title'];

    // calculate x axis offset
    var xAxisOffset = chartWidth/activeUserRatioData.length/2;
    chartWidth = chartWidth + xAxisOffset*2;

    // x scale. range from 0 to width
    var x = d3.time.scale()
      .domain(d3.extent(activeUserRatioData, getDate))
      .range([0, chartWidth]);

    // y scale. range from height to 0 (not 0 to height) to invert y scale (0 at bottom, max value at top)
    var y = d3.scale.linear()
      .domain([0, d3.max(activeUserRatioData, getTotalCount)])
      .rangeRound([chartHeight, 0]);

    // set some colors on an ordinal scale
    var color = d3.scale.ordinal()
      .domain(['active', 'total'])
      .range(['rgba(152, 223, 138, .7)', 'rgba(158, 218, 229, .7)']);

    // function generating x axis, passed to another function later
    var xAxis = d3.svg.axis()
      .scale(x)                               // scale it with d3.time.scale
      .orient('bottom')                       // set orientation to bottom
      .tickFormat(d3.time.format('%x'));      // declare tick format

    // do the same for y axis
    var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');

    if (container === '#all-data-chart') {
      // update container
      $(container).append('<div class="chart-module" id="active-total-users-chart-module"></div>');
      container = '#active-total-users-chart-module';
    }
    // add chart heading
    $(container).append(generateChartHeader(chartHeader));

    // add graph to container element, create an svg group element as a wrapper and
    // translate group to account for margins
    var svg = d3.select(container).append('svg')
      .attr('width',  svgWidth)
      .attr('height', svgHeight)
      .append('g')
        .attr('transform', 'translate(' + chartPadding['left'] + ',' + chartPadding['top'] + ')');

    // line helpers
    var totalUsersLine = d3.svg.line()
      .x(function(d) { return x(getDate(d)); })
      .y(function(d) { return y(getTotalCount(d)); });

    var activeUsersLine = d3.svg.line()
      .x(function(d) { return x(getDate(d)); })
      .y(function(d) { return y(getActiveCount(d)); });

    // add lines
    var activeTotalUsersLines = svg.append('g')
      .attr('class', 'active-total-users-line');

    activeTotalUsersLines.append('path')
      .attr('class', 'line total-users')
      .attr('d', totalUsersLine(activeUserRatioData));

    activeTotalUsersLines.append('path')
      .attr('class', 'line active-users')
      .attr('d', activeUsersLine(activeUserRatioData));

    // for each date, graph the group of active and total users
    var activeTotalUsers = svg.selectAll('.active-total-users')
      .data(activeUserRatioData)
      .enter().append('g')
      .attr('class', 'active-total-users')
      .attr('transform', function(d) {
        return 'translate(' + x(d['date']) + ', 0)';
      });


    // add axes
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0, ' + chartHeight + ')')
      .call(xAxis);
    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);

    svg.select('g.x.axis')
      .append('line')
      .attr('class', 'line x-axis')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', 0)
      .attr('y2', 0);

    svg.select('g.y.axis')
      .append('line')
      .attr('class', 'line y-axis')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', chartHeight);

    // add circles
    activeTotalUsers.selectAll('circle')
      .data(function(d) { return d['values']; })
      .enter().append('circle')
        .attr('class', function(d) { return d['name']; })
        .attr('r', 3)
        .attr('cy', function(d) { return y(d['finalYcount']); });

    // axis labels
    // generateAxisLabels(svg, chartWidth, chartHeight, 'date', 'users');

    // caption
    generateCaption(svg, svgWidth, svgHeight, activeUserRatioData, chartPadding);

    // legends for total and active users
    var legend = svg.append('g')
      .attr('class', 'multi-category legend')
      .selectAll('g')
      .data(color.domain().slice().reverse())
        .enter().append('g')
        .attr('transform', function(d, i) {
          return 'translate(' + (chartPadding['left'] - 60 + i * 100) + ',' + (chartHeight + 30) + ')'; 
        });

    legend.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .style('fill', color);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 9)
      .text(function(d) { return d + ' users'; });

    // add lines for better reading
    svg.selectAll('.rule')
      .data(y.ticks(10))
      .enter().append('line')
        .attr('class', 'rule')
        .attr('y1', function(d) { return y(d); })
        .attr('y2', function(d) { return y(d); })
        .attr('x1', 0)
        .attr('x2', chartWidth);

    // instantiate tooltips
    instantiateTipsy('circle', 'w');
  }


  /* Render stacked bar graph */
  function renderActiveUserRatioGraph(activeUserRatioData) {
    // declare graph width and height
    var svgDimensions   = metrics[metricKey]['dimensions'],
        svgWidth        = svgDimensions['width'],
        svgHeight       = svgDimensions['height'],
        chartPadding    = metrics[metricKey]['padding'],
        chartWidth      = svgWidth - chartPadding['left'] - chartPadding['right'],
        chartHeight     = svgHeight - chartPadding['top'] - chartPadding['bottom'],
        container       = metrics[metricKey]['container'],
        chartHeader     = metrics['active-user-ratio']['title'];

    // x scale. range from 0 to width
    var x = d3.time.scale()
      .domain(d3.extent(activeUserRatioData, getDate))
      .range([0, chartWidth]);

    // y scale. range from height to 0
    var y = d3.scale.linear()
      .rangeRound([chartHeight, 0]);

    // set some colors on an ordinal scale
    var color = d3.scale.ordinal()
      .domain(['active', 'total'])
      .range(['rgba(165, 81, 148, 1)', 'rgba(165, 81, 148, 0.0)']);

    // function generating x axis, passed to another function later
    var xAxis = d3.svg.axis()
      .scale(x)                               // scale it with d3.time.scale
      .orient('bottom')                       // set orientation to bottom
      .tickFormat(d3.time.format('%x'));      // declare tick format

    // do the same for y axis
    var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left')
      .tickFormat(d3.format('.0%'));

    if (container === '#all-data-chart') {
      // update container
      $(container).append('<div class="chart-module" id="active-user-ratio-chart-module"></div>');
      container = '#active-user-ratio-chart-module';
    }
    // add chart heading
    $(container).append(generateChartHeader(chartHeader));

    // add graph to container element, create an svg group element as a wrapper and
    // translate group to account for margins
    var svg = d3.select(container).append('svg')
      .attr('width',  svgWidth)
      .attr('height', svgHeight)
      .append('g')
        .attr('transform', 'translate(' + chartPadding['left'] + ',' + chartPadding['top'] + ')');

    // graph chart
    var activeUserRatio = svg.selectAll('.active-user-ratio')
      .data(activeUserRatioData)
      .enter().append('g')
      .attr('class', 'active-user-ratio')
      .attr('transform', function(d) {
        return 'translate(' + x(d['date']) + ', 0)';
      });

    // calculate bar width and x axis offset
    var barWidth    = chartWidth/activeUserRatioData.length,
        xAxisOffset = barWidth/2;

    // add axes
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + xAxisOffset + ',' + chartHeight + ')')
      .call(xAxis);
    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);

    svg.select('g.x.axis')
      .append('line')
      .attr('class', 'line x-axis')
      .attr('x1', 0 - xAxisOffset)
      .attr('x2', chartWidth + xAxisOffset)
      .attr('y1', 0)
      .attr('y2', 0);

    svg.select('g.y.axis')
      .append('line')
      .attr('class', 'line y-axis')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', chartHeight);

    // add rectangles
    activeUserRatio.selectAll('rect')
      .data(function(d) { return d['values']; })
      .enter().append('rect')
      .attr('width', function(d) { return barWidth; })
      .attr('class', function(d) { return d['name']; })
      .attr('y', function(d) { return y(d['finalYpct']); })
      .attr('height', function(d) { return y(d['initYpct']) - y(d['finalYpct']); })
      .style('fill', function(d) {
        if (d['name'] === 'active') {
          return getColorScale(d);
        } else {
          return 'rgba(0,0,0,0)';
        }
      });

    // axis labels
    // generateAxisLabels(svg, chartWidth, chartHeight, 'date', 'active user ratio');

    // add heatmap legend
    generateHeatmapLegend(svg, chartPadding, chartHeight);

    // caption
    generateCaption(svg, svgWidth, svgHeight, activeUserRatioData, chartPadding);

    // add lines for better reading
    svg.selectAll('.rule')
      .data(y.ticks(10))
      .enter().append('line')
        .attr('class', 'rule')
        .attr('y1', function(d) { return y(d); })
        .attr('y2', function(d) { return y(d); })
        .attr('x1', 0)
        .attr('x2', chartWidth + barWidth);

    instantiateTipsy('svg rect.active', 'w');
  }

  /* Generates the heatmap legend */
  function generateHeatmapLegend(chart, chartPadding, chartHeight) {
    var heatmapGradient = chart.append('svg:defs')
      .append('svg:linearGradient')
      .attr('id', 'gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%')
      .attr('spreadMethod', 'pad');

    heatmapGradient.append('svg:stop')
      .attr('offset', '0%')
      .attr('stop-color', 'rgb(205, 38, 38)')
      .attr('stop-opacity', 0.75);

    heatmapGradient.append('svg:stop')
      .attr('offset', '50%')
      .attr('stop-color', 'rgb(244, 202, 22)')
      .attr('stop-opacity', 0.75);

    heatmapGradient.append('svg:stop')
      .attr('offset', '100%')
      .attr('stop-color', 'rgb(76, 187, 23)')
      .attr('stop-opacity', 0.75);

    var heatmapLegend = chart.append('g')
      .attr('class', 'heatmap legend')
      .attr('transform', 'translate(' + (chartPadding['left'] - 30) + ',' + (chartHeight + 30) + ')');

    heatmapLegend.append('rect')
        .attr('width', 100)
        .attr('height', 7)
        .attr('class', 'heatmap')
        .style('fill', 'url(#gradient)');

    heatmapLegend.append('text')
      .attr('x', 0)
      .attr('dx', '-1em')
      .attr('y', 7)
      .attr('text-anchor', 'end')
      .text('0%');

    heatmapLegend.append('text')
      .attr('x', 100)
      .attr('dx', '1em')
      .attr('y', 7)
      .attr('text-anchor', 'start')
      .text('100%');
  }

  /* Returns an rgb string based on active user ratio data */
  function getColorScale(data) {
    var min        = 0,
        max        = data['totalCount'],
        activeCount = data['activeCount'],
        minRgbHash = { 'red': 205, 'green': 38, 'blue': 38 },
        midRgbHash = { 'red': 244, 'green': 202, 'blue': 22 },
        maxRgbHash = { 'red': 76, 'green': 187, 'blue': 23 },
        mid        = Math.floor( (min + max)/2 ),
        redSlope,
        greenSlope,
        blueSlope,
        redOffset,
        greenOffset,
        blueOffset,
        rgbHash;

    if (activeCount <= mid) {
      redSlope    = (midRgbHash['red'] - minRgbHash['red'])/(mid - min);
      greenSlope  = (midRgbHash['green'] - minRgbHash['green'])/(mid - min);
      blueSlope   = (midRgbHash['blue'] - minRgbHash['blue'])/(mid - min);
      redOffset   = minRgbHash['red'] - redSlope * min;
      greenOffset = minRgbHash['green'] - greenSlope * min;
      blueOffset  = minRgbHash['blue'] - blueSlope * min;
    } else {
      redSlope    = (maxRgbHash['red'] - midRgbHash['red'])/(max - mid);
      greenSlope  = (maxRgbHash['green'] - midRgbHash['green'])/(max - mid);
      blueSlope   = (maxRgbHash['blue'] - midRgbHash['blue'])/(max - mid);
      redOffset   = midRgbHash['red'] - redSlope * mid;
      greenOffset = midRgbHash['green'] - greenSlope * mid;
      blueOffset  = midRgbHash['blue'] - blueSlope * mid;
    }

    rgbHash = {
      'red'   : parseInt(redSlope*activeCount + redOffset),
      'green' : parseInt(greenSlope*activeCount + greenOffset),
      'blue'  : parseInt(blueSlope*activeCount + blueOffset)
    };
    return 'rgb(' + rgbHash['red'] + ',' + rgbHash['green'] + ',' + rgbHash['blue'] + ')';
  }

  function generateChartHeader(chartHeader) {
    var html = '<h2 class="graph-heading">' + chartHeader + '</h2>';
    return html;
  }

  function generateCaption(chart, svgWidth, svgHeight, activeUserRatioData, chartPadding) {
    chart.append('text')
        .attr('class', 'caption')
        .attr('text-anchor', 'end')
        .attr('x', svgWidth)
        .attr('dx', chartPadding['right'] - 150)
        .attr('y', svgHeight)
        .attr('dy', chartPadding['bottom'] - 80)
        .text('Data Generated on ' + activeUserRatioData[0]['generated']);
  }

  function generateAxisLabels(chart, chartWidth, chartHeight, xLabel, yLabel) {
    chart.select('g.x.axis')
      .append('text')
      .attr('class', 'axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', chartWidth/2)
      .attr('y', 0)
      .attr('dy', 40)
      .text(xLabel);

    chart.select('g.y.axis')
      .append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('y', 0)
        .attr('dy', -60)
        .attr('x', -1*chartHeight/2)
        .attr('transform', 'rotate(-90)')
        .text(yLabel);
  }

  function instantiateTipsy(element, gravity) {
    // instantiate tooltips
    $(element).tipsy({
      gravity: gravity,
      html: true,
      title: function() {
        var d     = this.__data__;
        return generateTipsyHtml(d);
      }
    });
  }

  /* Returns tooltip HTML */
  function generateTipsyHtml(data) {
    var label       = data['label'],
        name        = data['name'],
        activeCount = data['activeCount'],
        totalCount  = data['totalCount'],
        total       = data['total'],
        date        = prettifyDate(data['date']),
        pct         = (activeCount/totalCount * 100).toFixed(2) + '%',
        html;

    html  = '<div class="tipsy-content">' +
      '<p class="date">' + date + '</p>' +
      '<div class="stats active-users">' +
        '<p class="label">Active Users</p> ' +
        '<p class="value">' + activeCount + '</p>' +
      '</div>' +
      '<div class="stats total-users">' +
        '<p class="label">Total Users</p> ' +
        '<p class="value">' + totalCount + '</p>' +
      '</div>' +
      '<div class="stats active-user-ratio">' +
        '<p class="label">Active User Ratio</p> ' +
        '<p class="value" style="color: '+getColorScale(data)+';">' + pct + '</p>' +
      '</div>' +
      '</div>';
    return html;
  }

  /* Get date */
  function getDate(data) {
    return data['date'];
  }

  /* Get total users counts */
  function getTotalCount(data) {
    return parseInt(data['values'][0]['totalCount']);
  }

  /* Get active users counts */
  function getActiveCount(data) {
    return parseInt(data['values'][0]['activeCount']);
  }

  /* Returns date object from date string */
  function parseDate(dateStr) {
    var parsedDate  = dateStr.split('-'),
        year        = parsedDate[0],
        month       = parsedDate[1] - 1,
        day         = parsedDate[2];
    return new Date(year, month, day);
  }

  /* Returns formatted date string from Date Object */
  function prettifyDate(dateObj) {
    return dateObj.toString().split(' ').slice(1, 4).join(' ');
  }
};
