// Global app namespace
var App = {};

// Template for the url to get the olympics medal data
//
// Parameters:
// startYear
// endYear
App.dataUrlTemplate = _.template("/get?url=http%3A%2F%2Fnolympics.pebblecode.net%2Fapi%2FMedals%2F%3Ffirst%3D<%= startYear %>%26last%3D<%= endYear %>")
// App.dataUrl = _.template("/api/Medals/?first=<%= startYear %>&last=<%= endYear %>"

// Constants
App.summerStartYear = 1896;
App.summerEndYear = 2008;
App.winterStartYear = 1994;
App.winterEndYear = 2006; // Winter olympics was the same year as the summer olympics until 1992
App.yearsBetweenOlympics = 4;

App.canvasWidth = 960;
App.canvasHeight = 500;

App.removeCellDuration = 1000; // In milliseconds
App.transitionCellDuration = 1500; // In milliseconds

App.removeCellShrinkX = 0.2;
App.removeCellShrinkY = 0.2;

App.minFontScaleSize = 0.5;
App.maxFontScaleSize = 5;

App.colorScale = d3.scale.category20c();

(function() {
  function init() {
    App.olympicsNav = new App.NavView({ el: "#main" });
    App.router = new TabsRouter;
    Backbone.history.start();

    App.router.navigate("#summer-olympics", { trigger: true });
  }

  ///////////////////////////////////////////////////////////////
  // Router
  ///////////////////////////////////////////////////////////////

  var TabsRouter = Backbone.Router.extend({
      routes: {
        "summer-olympics": "summerOlympicsRoute",
        "winter-olympics": "winterOlympicsRoute"
      },
      initialize: function() {
        this.summerData = {
          elContext: "#summer-olympics",
          firstYear: App.summerStartYear,
          lastYear: App.summerEndYear,
          currentYear: App.summerEndYear,
          dataUrl: App.dataUrlTemplate({
            startYear: App.summerStartYear,
            endYear: App.summerEndYear
          }),
          treemapView: null,
          yearsSliderView: null
        };

        this.winterData = {
          elContext: "#winter-olympics",
          firstYear: App.winterStartYear,
          lastYear: App.winterEndYear,
          currentYear: App.winterEndYear,
          dataUrl: App.dataUrlTemplate({
            startYear: App.winterStartYear,
            endYear: App.winterEndYear
          }),
          treemapView: null,
          yearsSliderView: null
        };
      },
      summerOlympicsIsLoaded: false,
      summerOlympicsRoute: function() {
        if (!this.summerOlympicsIsLoaded) {
          $(this.summerData.elContext + " .medals-tree-map").addClass("loading");
          this._showData(this.summerData);
          this.summerOlympicsIsLoaded = true;
        }
      },
      winterOlympicsIsLoaded: false,
      winterOlympicsRoute: function() {
        if (!this.winterOlympicsIsLoaded) {
          $(this.winterData.elContext + " .medals-tree-map").addClass("loading");
          this._showData(this.winterData);
          this.winterOlympicsIsLoaded = true;
        }
      },
      _showData: function(olympicData) {
        var tabRouter = this;
        // Get json data
        d3.json(olympicData.dataUrl, function(data) {
          olympicData.treemapView = new App.TreemapView({
            el: olympicData.elContext + " .medals-tree-map",
            data: data
          });

          // Add control links
          tabRouter._appendControls(olympicData.elContext + " .medals-tree-map");

          olympicData.treemapView.render(olympicData.currentYear);

          // Handle toggling medal counts
          $(olympicData.elContext + " .toggle-medal-counts").click(function(event) {
            var link = event.target;
            if ($(link).hasClass("active")) {
              $(olympicData.elContext + " .medal").hide();
              $(olympicData.elContext + " .medals-tree-map .country .name").show();
              $(link).removeClass("active");
            } else {
              $(olympicData.elContext + " .medals-tree-map .medal").show();
              $(olympicData.elContext + " .medals-tree-map .country .name").hide();
              $(link).addClass("active");
            }
            event.preventDefault();
          });

          // Add years control
          olympicData.yearsSliderView = new App.YearsSliderView({
            el: olympicData.elContext + " .controls",
            elemContext: olympicData.elContext,
            data: data,
            yearSelected: olympicData.currentYear,
            olympicData: olympicData
          })

          $(olympicData.elContext + " .medals-tree-map").removeClass("loading");
        });

        // Add data source
        tabRouter._appendDataSource(olympicData.elContext + " .data-source", olympicData.dataUrl);
      },
      _appendControls: function(elemToAttachTo) {
        var controlsTemplate = _.template("\
        <ul class='controls'>\
          <li><a href='#' class='toggle-medal-counts'>Toggle medal counts</a></li>\
        </ul>")
        $(elemToAttachTo).append(controlsTemplate());
      },
      _appendDataSource: function(elemToAttachTo, dataUrl) {
        var dataSourceHtml = _.template("Data source: <a href='<%= dataSource %>'><%= dataSource %></a>")
        $(elemToAttachTo).append(dataSourceHtml({ dataSource: dataUrl }));
      }
  });


  ///////////////////////////////////////////////////////////////
  // Views
  ///////////////////////////////////////////////////////////////

  App.NavView = Backbone.View.extend({
    events: {
      "click #nav-summer-olympics a": "renderSummerOlympics",
      "click #nav-winter-olympics a": "renderWinterOlympics"
    },
    renderSummerOlympics: function(event) {
      var menuItem = event.target;
      if (!$(menuItem).hasClass("active")) {
        App.router.navigate("#summer-olympics", { trigger: true });
      }
    },
    renderWinterOlympics: function(event) {
      var menuItem = event.target;
      if (!$(menuItem).hasClass("active")) {
        App.router.navigate("#winter-olympics", { trigger: true });
      }
    },
    _clearActiveMenus: function() {
      $(".nav li").removeClass("active");
    }

  });

  // Years view
  //
  // Parameters:
  //   data
  //   elemContext - the container to put in all rendered elements
  //   yearSelected
  //   olympicData
  App.YearsSliderView = Backbone.View.extend({
    initialize: function() {
      this.data = this.options.data;
      this.years = _.pluck(this.data, 'year');
      this.elemContext = this.options.elemContext;
      this.olympicData = this.options.olympicData;

      this.render(this.options.yearSelected);
    },
    // App.olympicTreemap (render)
    render: function(yearSelected) {
      var thisYearsSlider = this;

      var yearsTemplate = _.template("<li class='year-selector'></li>");
      $(thisYearsSlider.el).prepend(yearsTemplate());

      // Handle selecting different years
      var yearsSel = thisYearsSlider.elemContext + " .year-selector";
      d3.selectAll(yearsSel + " a").on("click", function() {
        var yearLink = this;
        var linkIndex = $(yearLink).prevAll().length;

        drawGraphFromJson(thisYearsSlider.data[linkIndex]);

        $(yearsSel + " a").removeClass("active");
        $(yearLink).addClass("active");

        return false;
      });
      if (thisYearsSlider.years.length > 0) {
        $(yearsSel).slider({
          value: yearSelected,
          min: parseInt(thisYearsSlider.years[0]),
          max: parseInt(thisYearsSlider.years[thisYearsSlider.years.length - 1]),
          step: App.yearsBetweenOlympics,
          create: function(event, ui) {
            $(thisYearsSlider.elemContext + ' .year-selector .ui-slider-handle').html("<span class='year-label'>" + yearSelected + "</span>")
          },
          change: function(event, ui) {
            var currentYear = parseInt(ui.value);
            thisYearsSlider.olympicData.treemapView.render(currentYear);
            $(thisYearsSlider.elemContext + ' .year-label').html(currentYear);
          },
          slide: function(event, ui) {
            $(thisYearsSlider.elemContext + ' .year-label').html(ui.value); // Show current slider value
          }
        })
        .css({
          "width": App.canvasWidth // Same size as canvas width
        });
      }
    }
  });

  App.TreemapView = Backbone.View.extend({
    svg: null,
    treemap: null,
    initialize: function() {
      this.data = this.options.data;

      // Create svg container
      this.svg = d3.select(this.el).append("svg:svg")
          .style("width", App.canvasWidth + "px")
          .style("height", App.canvasHeight + "px")
        .append("svg:g")
          .attr("transform", "translate(-.5,-.5)")
          .attr("id", "container");

      var countryCodes = this._findCountryCodes(this.data);
      // Construct treemap layout
      this.treemap = d3.layout.treemap()
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
            _.each(countryCodes, function(countryCode) {
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
    },
    render: function(year) {
      var thisTreemap = this;
      // Construct treemap with data
      var leaves = thisTreemap.treemap(_.find(thisTreemap.data, function(elem) { return elem.year === year }));

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
      var cell = this.svg.selectAll("g.cell")
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
      cell.call(thisTreemap._updateGraph);

      // Animate removal of cells
      cell.exit()
        .transition()
          .duration(App.removeCellDuration)
          .call(function(selection) {
            // Shrink to remove cell
            selection
              .attr('transform', function(d) {
                return "scale(" + App.removeCellShrinkX + "," + App.removeCellShrinkY +")";
              });
          })
        .remove();

      // Handle years when there were no olympics
      $("#no-olympics-msg").remove();
      if (year === 1916) {
        $("#medals-tree-map").append("<div id='no-olympics-msg'>No olympics in 1916 (World War 1)</div>");
      } else if ((year === 1940) || (year === 1944)) {
        $("#medals-tree-map").append("<div id='no-olympics-msg'>No olympics in " + String(year) + " (World War 2)</div>");
      } else {
        this._addCountryTooltips();
      }
    },
    // Add tooltips for country cells
    _addCountryTooltips: function() {
      var medalsTemplate = _.template("Gold: <%= gold %>, Silver: <%= silver %>, Bronze: <%= bronze %>");
      d3.selectAll("g.country").each(function(d) {
        var country = $(this);
        country.qtip({
          content: {
            title: d.data.country_name,
            text: medalsTemplate({ gold: d.data.gold, silver: d.data.silver, bronze: d.data.bronze })
          },
          position: {
              my: 'top left',
              target: 'mouse',
              viewport: $(window), // Keep it on-screen at all times if possible
              adjust: {
                  x: 10,  y: 10
              }
          },
          hide: {
              fixed: true // Helps to prevent the tooltip from hiding ocassionally when tracking!
          },
          style: 'ui-tooltip-shadow'
        });
      });
    },
    _updateGraph: function(selection) {
      // Place cell
      selection
        .transition()
          .duration(App.transitionCellDuration)
          .call(function(selection) {
            selection.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
          });

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
      selection.select("text.name")
        .attr("x", function(d) { return d.dx / 2; })
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
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
    },
    // Returns a unique array of all countries
    _findCountryCodes: function(data) {
      var countryArrays = _.pluck(data, 'countries');
      var allCountryArrays = _.flatten(countryArrays);
      var uniqueCountryArrays = _.uniq(allCountryArrays, false, function(elem) {
        return elem.country_code;
      });
      var country_codes = _.pluck(uniqueCountryArrays, "country_code")

      return country_codes;
    }
  });

  // Initialise the app
  init();

})();


function getCssClass(str) {
  if (str !== undefined) {
    var formattedStr = str.toLowerCase().replace(/W/g, '-');
    return _.escape(formattedStr);
  } else {
    return "";
  }
}
