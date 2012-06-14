// Global app namespace
var App = {};

App.data = null;
App.years = null;
App.countryCodes = [];
App.currentYear = 2008; // The year to show first

// Data urls
App.dataUrl = "/get?url=http%3A%2F%2Fnolympics.pebblecode.net%2Fapi%2FMedals%2F%3Ffirst%3D1896%26last%3D2008"
// App.dataUrl = "/api/Medals/?first=1996&last=2008"

// Constants
App.yearsBetweenOlympics = 4;

App.canvasWidth = 960;
App.canvasHeight = 500;

App.removeCellDuration = 1000; // In milliseconds
App.transitionCellDuration = 1500; // In milliseconds

App.removeCellShrinkX = 0.2;
App.removeCellShrinkY = 0.2;

App.minFontScaleSize = 0.5;
App.maxFontScaleSize = 5;


(function() {

  // Show data source
  var dataSourceHtml = _.template("Data source: <a href='<%= dataSource %>'><%= dataSource %></a>")
  $("#data-source").html(dataSourceHtml({ dataSource: App.dataUrl }));

  ///////////////////////////////////////////////////////////////
  // Olympic tree map
  ///////////////////////////////////////////////////////////////

  App.colorScale = d3.scale.category20c();

  // Create svg container
  App.svg = d3.select("#medals-tree-map").append("svg:svg")
      .style("width", App.canvasWidth + "px")
      .style("height", App.canvasHeight + "px")
    .append("svg:g")
      .attr("transform", "translate(-.5,-.5)")
      .attr("id", "container");

  // Construct treemap layout
  App.treemap = d3.layout.treemap()
    .size([App.canvasWidth + 1, App.canvasHeight + 1])
    .value(function(d) {
      return d.number;
    })
    .children(function(d) {
      if (_.has(d, "countries")) {
        var allCountries = [];
        // For each country code, add the countries data in
        // if it exists. Otherwise fill it in with 0 medals
        // for gold/silver/bronze
        _.each(App.countryCodes, function(countryCode) {
          var countryData = _.find(d.countries, function(elem) {
            return elem.country_code === countryCode;
          })

          if (countryData) {
            allCountries.push(countryData);
          } else {
            allCountries.push({
              country_code: countryCode,
              gold: 0,
              silver: 0,
              bronze: 0
            })
          }
        });

        return allCountries;
      } else if (_.has(d, "country_code")) {
        // Contruct medal children nodes
        return [
            { medal: "gold", number: d.gold },
            { medal: "silver", number: d.silver },
            { medal: "bronze", number: d.bronze }
          ];
      } else {
        return null;
      }
    });

  // Add control links
  appendControls("controls", "#medals-tree-map");

  // Handle toggling medal counts
  $("#toggle-medal-counts").click(function(event) {
    var link = event.target;
    if ($(link).hasClass("active")) {
      $("#medals-tree-map .medal").hide();
      $("#medals-tree-map .country .name").show();
      $(link).removeClass("active");
    } else {
      $("#medals-tree-map .medal").show();
      $("#medals-tree-map .country .name").hide();
      $(link).addClass("active");
    }
    event.preventDefault();
  });

  // Get json data
  App.medalsData = d3.json(App.dataUrl, function(data) {
    App.data = data;
    App.years = _.pluck(App.data, 'year');
    App.countryCodes = findCountryCodes(App.data);
    drawGraphForYear(App.data, App.currentYear);

    // Add years control
    prependYearsControl("year-selector", "#controls", App.currentYear);
  });

  // Returns a unique array of all countries
  function findCountryCodes(data) {
    var countryArrays = _.pluck(data, 'countries');
    var allCountryArrays = _.flatten(countryArrays);
    var uniqueCountryArrays = _.uniq(allCountryArrays, false, function(elem) {
      return elem.country_code;
    });
    var country_codes = _.pluck(uniqueCountryArrays, "country_code")

    return country_codes;
  }

  function drawGraphForYear(data, year) {
    // Construct treemap with data
    var leaves = App.treemap(_.find(App.data, function(elem) { return elem.year === year }));

    // Scale font size based on area of tree cells
    App.fontScale = d3.scale.linear()
      // Check the country cells for their areas
      .domain(d3.extent(leaves, function(d) {
        if (d.depth === 1) {
          return d.area;
        } else {
          return null;
        }
      }))
      .range([App.minFontScaleSize, App.maxFontScaleSize]);

    // Associate data and html elements (yet to be created)
    var cell = App.svg.selectAll("g.cell")
      .data(leaves);

    // Create html elements
    var entering = cell.enter()
      .append("g")
        // Add classes for different depths of data
        .attr("class", function(d) {
          var cssClass = "cell";
          cssClass += " depth-" + d.depth;
          if (d.depth === 0) {
            cssClass += " year";
            cssClass += " year-" + getCssClass(String(d.data.year));
          } else if (d.depth === 1) {
            cssClass += " country";
            cssClass += " country-" + getCssClass(String(d.data.country_code));
          } else {
            cssClass += " medal";
            cssClass += (" medal-" + getCssClass(d.data.medal));
          }
          return cssClass;
        })
    entering.append("rect"); // Blocks
    entering.append("text").attr("class", "name"); // Add name of countries

    // Update cells
    cell.call(updateGraph);

    // Animate removal of cells
    cell.exit()
      .transition()
        .duration(App.removeCellDuration)
        .call(animateCellRemove)
      .remove();


    // Add popovers for cells (shows `title` and `data-content` attributes)
    $('.country .name').popover({
      placement: "right"
    });
  }

  function updateGraph(selection) {
    // Place cell
    selection
      .transition()
        .duration(App.transitionCellDuration)
        .call(animateCellMove);

    // Create block
    selection.select("rect")
      .attr("width", function(d) { return d.dx; })
      .attr("height", function(d) { return d.dy; })
      .attr("data-area", function(d) { return d.area; })
      .style("fill", function(d) {
        var c = null;
        if (d.depth === 0) { // Year
          // No color
        } else if (d.depth === 1) { // Country
          c = App.colorScale(d.data.country_code);
        } else { // Medal
          c = App.colorScale(d.data.medal);
        }
        return c;
      });

    // Create name labels
    var medalsTemplate = _.template("Gold: <%= gold %>, Silver: <%= silver %>, Bronze: <%= bronze %>");
    selection.select("text.name")
      .attr("x", function(d) { return d.dx / 2; })
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("title", function(d) { return d.data.country_name; })
      .attr("data-content", function(d) {
        if (_.has(d.data, "country_code")) { // Country
          return medalsTemplate({ gold: d.data.gold, silver: d.data.silver, bronze: d.data.bronze });
        }
      })
      .text(function(d) {
        var text = null;
        if (_.has(d.data, "country_code")) { // Country
          if (d.value >= 5) {
            text = d.data.country_code;
          }
        } else if (_.has(d.data, "medal") && (d.parent.value >= 5) && (d.value > 0)) {
          text = d.data.number
        }

        return text;
      })
      .style("font-size", function(d) { return App.fontScale(d.area) + "em"; });
  }

  function animateCellRemove(selection) {
    // Shrink to remove cell
    selection
      .attr('transform', function(d) {
        return "scale(" + App.removeCellShrinkX + "," + App.removeCellShrinkY +")";
      });
  }

  function animateCellMove(selection) {
    selection.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }

  function appendControls(controlsId, elemToAttachTo) {
    var controlsTemplate = _.template("\
    <ul id='<%= id %>'>\
      <li><a href='#' id='toggle-medal-counts'>Toggle medal counts</a></li>\
    </ul>")
    $(elemToAttachTo).append(controlsTemplate({ id: controlsId }));
  }

  function prependYearsControl(yearsSelId, elemToAttachTo, yearSelected) {
    var yearsTemplate = _.template("<li id=<%= id %>></li>");
    $(elemToAttachTo).prepend(yearsTemplate({ id: yearsSelId }));

    // Handle selecting different years
    var yearsSel = "#" + yearsSelId;
    d3.selectAll(yearsSel + " a").on("click", function() {
      var yearLink = this;
      var linkIndex = $(yearLink).prevAll().length;

      drawGraphFromJson(App.data[linkIndex]);

      $(yearsSel + " a").removeClass("active");
      $(yearLink).addClass("active");

      return false;
    });
    if (App.years.length > 0) {
      $(yearsSel).slider({
        value: App.currentYear,
        min: parseInt(App.years[0]),
        max: parseInt(App.years[App.years.length - 1]),
        step: App.yearsBetweenOlympics,
        create: function(event, ui) {
          $('#year-selector .ui-slider-handle').html("<span id='year-label'>" + App.currentYear + "</span>")
        },
        change: function(event, ui) {
          App.currentYear = parseInt(ui.value);
          drawGraphForYear(App.data, App.currentYear);
          $('#year-label').html(App.currentYear);
        },
        slide: function(event, ui) {
          $('#year-label').html(ui.value); // Show current slider value
        }
      })
      .css({
        "width": App.canvasWidth // Same size as canvas width
      });
    }
  }

})();


function getCssClass(str) {
  if (str !== undefined) {
    var formattedStr = str.toLowerCase().replace(/W/g, '-');
    return _.escape(formattedStr);
  } else {
    return "";
  }
}
